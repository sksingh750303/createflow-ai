import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { generateImages } from "@/lib/ai/provider";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import { STORAGE_BUCKETS, uploadRemoteFileToSupabase, uploadToSupabaseStorage } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(1, "Describe the image you want first.").max(2000),
  style: z.string().max(60),
  aspectRatio: z.string().max(20),
  quality: z.string().max(20),
  count: z.number().int().min(1).max(4),
  projectId: z.string().max(200).nullable().optional(),
});

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new AiApiError("GENERATION_FAILED", "Unexpected image format from provider.", 502);
  return { buffer: Buffer.from(match[2], "base64"), contentType: match[1] };
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "ai-image", limit: 20, windowSeconds: 60 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const input = parsed.data;
    const cost = CREDIT_COSTS.imagePerImage * input.count;

    const db = getAdminDb();
    const genRef = db.collection("generations").doc();

    await chargeCredits({
      uid: authed.uid,
      amount: cost,
      generationId: genRef.id,
      description: `Image generation × ${input.count}`,
    });

    try {
      const result = await generateImages(input);

      const uploaded = await Promise.all(
        result.images.map(async (img, i) => {
          const path = `${authed.uid}/${genRef.id}/${i}.${img.contentType.includes("svg") ? "svg" : "png"}`;
          if (img.url.startsWith("data:")) {
            const { buffer, contentType } = dataUrlToBuffer(img.url);
            return uploadToSupabaseStorage({
              bucket: STORAGE_BUCKETS.images,
              path,
              data: buffer,
              contentType,
              upsert: true,
            });
          }
          // Provider returned a hosted URL (e.g. OpenAI's temporary image
          // URL) — fetch it and persist our own copy so it doesn't expire.
          return uploadRemoteFileToSupabase({
            bucket: STORAGE_BUCKETS.images,
            path,
            sourceUrl: img.url,
            contentType: img.contentType,
          });
        })
      );

      const imageUrls = uploaded.map((u) => u.publicUrl);

      await genRef.set({
        ownerId: authed.uid,
        type: "Images",
        title: input.prompt,
        prompt: input.prompt,
        content: `${input.count} image(s) generated · ${input.style} · ${input.aspectRatio} · ${input.quality}`,
        status: "completed",
        creditsUsed: cost,
        projectId: input.projectId ?? null,
        imageUrls,
        createdAt: FieldValue.serverTimestamp(),
      });

      await Promise.all(
        uploaded.map((u, i) =>
          db.collection("files").add({
            ownerId: authed.uid,
            generationId: genRef.id,
            projectId: input.projectId ?? null,
            storagePath: u.path,
            bucket: u.bucket,
            publicUrl: u.publicUrl,
            mimeType: result.images[i].contentType,
            size: 0,
            createdAt: FieldValue.serverTimestamp(),
          })
        )
      );

      return NextResponse.json({ generationId: genRef.id, imageUrls });
    } catch (err) {
      await refundCredits({
        uid: authed.uid,
        amount: cost,
        generationId: genRef.id,
        description: "Refund — image generation failed",
      });
      throw err;
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}
