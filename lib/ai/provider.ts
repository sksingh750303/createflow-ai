import "server-only";

// This is the ONLY file API routes should import AI functionality from.
// It decides — based on AI_MOCK_MODE — whether to call the real provider
// implementations (lib/ai/text.ts, image.ts, video-provider.ts) or the
// existing local mock engine (lib/mock-ai.ts), so:
//
//   UI → /api/ai/* route → lib/ai/provider.ts → (mock | real provider)
//
// Components never talk to a provider (or even know which one is active).

import {
  ChatMessageInput,
  ImageGenerationInput,
  ImageGenerationResult,
  TextGenerationInput,
  TextGenerationResult,
  VideoGenerationInput,
  VideoJobHandle,
  VideoJobResult,
} from "@/lib/ai/types";
import { generateTextReal, streamChatReal } from "@/lib/ai/text";
import { generateImagesReal } from "@/lib/ai/image";
import {
  cancelVideoJob as cancelVideoJobReal,
  createVideoJob as createVideoJobReal,
  getVideoJobStatus as getVideoJobStatusReal,
} from "@/lib/ai/video-provider";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import * as mockAi from "@/lib/mock-ai";

let loggedMode = false;

export function isMockMode(): boolean {
  // Forgiving parsing — "false", "False", "FALSE", "0", "no", with or
  // without stray whitespace, all count as "turn mock mode off". Only an
  // explicit disable should turn on real providers; anything else
  // (unset, "true", typos) safely stays in mock mode rather than
  // accidentally spending API credits.
  const raw = (process.env.AI_MOCK_MODE ?? "true").trim().toLowerCase();
  const mock = !["false", "0", "no", "off"].includes(raw);

  if (!loggedMode) {
    loggedMode = true;
    // eslint-disable-next-line no-console
    console.info(
      mock
        ? '[ai] Running in MOCK mode (AI_MOCK_MODE is not "false") — generations use local placeholder content, not Hugging Face. Set AI_MOCK_MODE=false in .env.local and restart the server for real AI responses.'
        : "[ai] Running in REAL provider mode (Hugging Face) — AI_MOCK_MODE=false."
    );
  }

  return mock;
}

// ---------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------

export async function generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
  if (isMockMode()) {
    const content = await mockAi.generateText({
      topic: input.topic,
      tone: input.tone,
      language: input.language,
      length: input.length,
      keywords: input.keywords,
      instructions: input.instructions,
      toolName: input.tool,
    });
    return { content };
  }
  return generateTextReal(input);
}

// ---------------------------------------------------------------------
// Chat (streaming)
// ---------------------------------------------------------------------

export async function* streamChat(params: {
  messages: ChatMessageInput[];
  brandVoiceContext?: string;
}): AsyncGenerator<string> {
  if (isMockMode()) {
    const text = await mockAi.generateText({
      topic: params.messages[params.messages.length - 1]?.content ?? "this",
      toolName: "AI Chat",
    });
    // Simulate token-by-token streaming so the UI's streaming code path
    // gets real exercise even in mock mode.
    const words = text.split(" ");
    for (const word of words) {
      await mockAi.mockDelay(15);
      yield `${word} `;
    }
    return;
  }

  const system = buildChatSystemPrompt(params.brandVoiceContext);
  yield* streamChatReal({ system, messages: params.messages });
}

// ---------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------

function mockImageDataUrl(label: string): string {
  const colors = ["#7C5CFC", "#22D3EE", "#F97316", "#10B981", "#EC4899"];
  const [c1, c2] = [colors[Math.floor(Math.random() * colors.length)], colors[Math.floor(Math.random() * colors.length)]];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="36" text-anchor="middle" opacity="0.85">${label.slice(0, 40)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function generateImages(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  if (isMockMode()) {
    await mockAi.mockDelay(300);
    return {
      images: Array.from({ length: input.count }).map(() => ({
        url: mockImageDataUrl(input.prompt || "Demo generation"),
        contentType: "image/svg+xml",
      })),
    };
  }
  return generateImagesReal(input);
}

// ---------------------------------------------------------------------
// Video (async job)
// ---------------------------------------------------------------------

// Public-domain sample clip used ONLY in mock mode, so the full async job
// → webhook/poll → Storage → Firestore pipeline can be exercised end to
// end without a real (paid) video provider configured.
const MOCK_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export async function createVideoJob(
  input: VideoGenerationInput,
  ownerId: string
): Promise<VideoJobHandle> {
  if (isMockMode()) {
    return { providerJobId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: "queued" };
  }
  return createVideoJobReal(input, ownerId);
}

/**
 * In mock mode, job status is derived purely from elapsed time since the
 * job id was minted (job ids are timestamp-prefixed) — no server-side
 * timers are used, since serverless functions can't rely on those across
 * invocations. This keeps status polling stateless and correct even if
 * the first poll happens seconds or minutes later.
 */
export async function getVideoJobStatus(providerJobId: string): Promise<VideoJobResult> {
  if (isMockMode()) {
    const startedAt = Number(providerJobId.split("_")[1] ?? 0);
    const elapsed = Date.now() - startedAt;
    if (elapsed < 3000) return { status: "queued" };
    if (elapsed < 9000) return { status: "processing", progress: Math.min(90, Math.round((elapsed / 9000) * 90)) };
    return { status: "completed", outputUrl: MOCK_VIDEO_URL };
  }
  return getVideoJobStatusReal(providerJobId);
}

export async function cancelVideoJob(providerJobId: string): Promise<void> {
  if (isMockMode()) return;
  return cancelVideoJobReal(providerJobId);
}
