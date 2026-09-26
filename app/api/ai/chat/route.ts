import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { streamChat } from "@/lib/ai/provider";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  conversationId: z.string().min(1).max(200).nullable(),
  message: z.string().min(1, "Enter a message.").max(4000),
});

export async function POST(req: NextRequest) {
  let authed;
  try {
    authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "ai-chat", limit: 60, windowSeconds: 60 });
  } catch (err) {
    return toErrorResponse(err);
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return toErrorResponse(
      new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400)
    );
  }
  const { message } = parsed.data;
  const db = getAdminDb();

  // Resolve (or create) the conversation, and load prior turns for context.
  let conversationId = parsed.data.conversationId;
  let history: { role: "user" | "assistant"; content: string }[] = [];

  if (conversationId) {
    const convoSnap = await db.collection("conversations").doc(conversationId).get();
    if (!convoSnap.exists || convoSnap.data()?.ownerId !== authed.uid) {
      return toErrorResponse(new AiApiError("NOT_FOUND", "Conversation not found.", 404));
    }
    const messagesSnap = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(20)
      .get();
    history = messagesSnap.docs.map((d) => ({
      role: d.data().role,
      content: d.data().content,
    }));
  } else {
    const convoRef = db.collection("conversations").doc();
    conversationId = convoRef.id;
    await convoRef.set({
      ownerId: authed.uid,
      title: message.slice(0, 48),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const genId = `chat_${conversationId}_${Date.now()}`;
  try {
    await chargeCredits({
      uid: authed.uid,
      amount: CREDIT_COSTS.chatMessage,
      generationId: genId,
      description: "AI Chat message",
    });
  } catch (err) {
    return toErrorResponse(err);
  }

  const messagesRef = db.collection("conversations").doc(conversationId).collection("messages");
  await messagesRef.add({
    conversationId,
    role: "user",
    content: message,
    createdAt: FieldValue.serverTimestamp(),
  });

  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({ messages: [...history, { role: "user", content: message }] })) {
          fullReply += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        await messagesRef.add({
          conversationId,
          role: "assistant",
          content: fullReply,
          createdAt: FieldValue.serverTimestamp(),
        });
        await db.collection("conversations").doc(conversationId!).update({
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        // Log the REAL reason here — this is the only place it's visible.
        // Pass the raw error object (not err.stack/err.message) so Node
        // prints its nested `cause` automatically — that's what shows the
        // actual DNS/connection/TLS detail for a generic "fetch failed".
        // eslint-disable-next-line no-console
        console.error("[api/ai/chat] streamChat failed:", err);

        // Streaming failed (partway or immediately) — refund the message
        // credit since the user didn't get a usable reply.
        await refundCredits({
          uid: authed!.uid,
          amount: CREDIT_COSTS.chatMessage,
          generationId: genId,
          description: "Refund — chat generation failed",
        }).catch(() => {});

        const errorNote =
          (fullReply ? "\n\n" : "") +
          "[The assistant failed to respond — your credit was refunded. Check the server terminal log for the exact reason. Please try again.]";
        controller.enqueue(encoder.encode(errorNote));

        // BUG FIX: previously this error text was only ever streamed to
        // the browser and never saved anywhere — since the chat log's
        // source of truth is Firestore (see lib/firebase/firestore.ts →
        // subscribeMessages), the message would flash briefly then
        // disappear the instant streaming ended, looking like a totally
        // silent failure. Persist it as the assistant's turn so it stays
        // visible in the conversation, same as a real reply would.
        await messagesRef.add({
          conversationId,
          role: "assistant",
          content: fullReply + errorNote,
          createdAt: FieldValue.serverTimestamp(),
        });
        await db.collection("conversations").doc(conversationId!).update({
          updatedAt: FieldValue.serverTimestamp(),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-conversation-id": conversationId,
      "cache-control": "no-cache",
    },
  });
}
