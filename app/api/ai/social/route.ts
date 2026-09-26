import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { generateText } from "@/lib/ai/provider";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  platform: z.string().min(1).max(40),
  brand: z.string().max(120).optional(),
  audience: z.string().max(200).optional(),
  objective: z.string().max(60).optional(),
  tone: z.string().max(60).optional(),
  topic: z.string().min(1, "Enter a topic first.").max(1000),
});

function parseStructuredPost(raw: string) {
  const get = (label: string) => {
    const match = raw.match(new RegExp(`${label}:\\s*(.+)`, "i"));
    return match?.[1]?.trim() ?? "";
  };
  const hashtagsLine = get("Hashtags");
  const hashtags = hashtagsLine
    ? hashtagsLine.split(/\s+/).filter((t) => t.startsWith("#"))
    : [];

  return {
    hook: get("Hook") || raw.split("\n")[0] || "",
    caption: get("Caption") || raw,
    cta: get("CTA") || "",
    hashtags: hashtags.length ? hashtags : ["#createflowai"],
  };
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "ai-social", limit: 30, windowSeconds: 60 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const input = parsed.data;

    const db = getAdminDb();
    const genRef = db.collection("generations").doc();

    await chargeCredits({
      uid: authed.uid,
      amount: CREDIT_COSTS.socialPost,
      generationId: genRef.id,
      description: `Social post: ${input.platform}`,
    });

    try {
      const result = await generateText({
        tool: `social-${input.platform.toLowerCase()}`,
        topic: input.topic,
        tone: input.tone,
        instructions: [
          `Write a ${input.platform} post for ${input.brand || "the brand"}.`,
          input.audience ? `Audience: ${input.audience}.` : "",
          input.objective ? `Objective: ${input.objective}.` : "",
          `Respond in EXACTLY this format, one per line:`,
          `Hook: <a scroll-stopping opening line>`,
          `Caption: <the full caption>`,
          `CTA: <one call to action>`,
          `Hashtags: <5 relevant hashtags, space separated, each starting with #>`,
        ]
          .filter(Boolean)
          .join(" "),
      });

      const post = parseStructuredPost(result.content);

      await genRef.set({
        ownerId: authed.uid,
        type: "Social",
        title: `${input.platform} post – ${input.topic}`,
        prompt: input.topic,
        content: post.caption,
        status: "completed",
        creditsUsed: CREDIT_COSTS.socialPost,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ generationId: genRef.id, post });
    } catch (err) {
      await refundCredits({
        uid: authed.uid,
        amount: CREDIT_COSTS.socialPost,
        generationId: genRef.id,
        description: "Refund — social generation failed",
      });
      throw err;
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}
