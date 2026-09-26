import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { generateText } from "@/lib/ai/provider";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const bodySchema = z.object({
  kind: z.enum(["text", "seo"]).default("text"),
  tool: z.string().min(1).max(80),
  topic: z.string().min(1, "Enter a topic first.").max(2000),
  tone: z.string().max(60).optional(),
  language: z.string().max(60).optional(),
  length: z.string().max(20).optional(),
  keywords: z.string().max(500).optional(),
  instructions: z.string().max(2000).optional(),
  projectId: z.string().max(200).nullable().optional(),
});

/** A simple, honest heuristic SEO scorer computed from the actual generated
 * text (not random) — readability by sentence length, keyword usage by
 * counting occurrences, structure by paragraph/heading-like breaks. This
 * is intentionally lightweight; swap in a dedicated SEO API for
 * production-grade scoring. */
function scoreSeoContent(content: string, keywords?: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgSentenceLen = sentences.length ? words.length / sentences.length : words.length;
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  const readability = Math.max(40, Math.min(98, Math.round(110 - avgSentenceLen * 2.2)));

  let keywordUsage = 60;
  if (keywords) {
    const kw = keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const lower = content.toLowerCase();
    const hits = kw.filter((k) => k && lower.includes(k)).length;
    keywordUsage = kw.length ? Math.round((hits / kw.length) * 100) : 60;
  }

  const headingStructure = Math.min(100, 55 + paragraphs.length * 8);
  const contentLength = Math.min(100, Math.round((words.length / 900) * 100));
  const metaData = Math.min(100, 60 + Math.min(30, words.length / 20));
  const score = Math.round(
    readability * 0.25 + keywordUsage * 0.3 + headingStructure * 0.2 + contentLength * 0.25
  );

  return { score, readability, keywordUsage, headingStructure, metaData: Math.round(metaData), contentLength };
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "ai-text", limit: 30, windowSeconds: 60 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const input = parsed.data;

    const cost = input.kind === "seo" ? CREDIT_COSTS.seoAnalysis : CREDIT_COSTS.textGeneration;

    const db = getAdminDb();
    const genRef = db.collection("generations").doc();

    // Charge BEFORE calling the provider — if the provider call then
    // fails, we refund (see catch block) rather than risk a free retry
    // loop that never gets billed.
    await chargeCredits({
      uid: authed.uid,
      amount: cost,
      generationId: genRef.id,
      description: `${input.kind === "seo" ? "SEO analysis" : "Text generation"}: ${input.tool}`,
    });

    try {
      const result = await generateText({
        tool: input.tool,
        topic: input.topic,
        tone: input.tone,
        language: input.language,
        length: input.length,
        keywords: input.keywords,
        instructions: input.instructions,
      });

      const seo = input.kind === "seo" ? scoreSeoContent(result.content, input.keywords) : null;

      await genRef.set({
        ownerId: authed.uid,
        type: input.kind === "seo" ? "SEO" : "Writing",
        title: input.topic,
        prompt: input.topic,
        content: result.content,
        status: "completed",
        creditsUsed: cost,
        projectId: input.projectId ?? null,
        seo: seo ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        generationId: genRef.id,
        content: result.content,
        seo,
      });
    } catch (err) {
      // Provider failed after we charged — mark the generation failed and
      // refund the credits so the user isn't charged for nothing.
      await genRef.set(
        {
          ownerId: authed.uid,
          type: input.kind === "seo" ? "SEO" : "Writing",
          title: input.topic,
          prompt: input.topic,
          content: "",
          status: "failed",
          creditsUsed: 0,
          errorMessage: err instanceof Error ? err.message : "Generation failed.",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await refundCredits({
        uid: authed.uid,
        amount: cost,
        generationId: genRef.id,
        description: "Refund — generation failed",
      });
      throw err;
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}
