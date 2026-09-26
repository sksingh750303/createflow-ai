import "server-only";

import { TextGenerationInput } from "@/lib/ai/types";
import { getToolBySlug } from "@/lib/tools";

/**
 * Builds a single, well-structured prompt for the text model from
 * structured tool input. Keeping this in one place means every tool
 * (writer, SEO, social, templates) gets consistent, high-quality prompts
 * instead of components building ad-hoc prompt strings.
 */
export function buildTextPrompt(input: TextGenerationInput): {
  system: string;
  user: string;
} {
  const tool = getToolBySlug(input.tool);
  const toolName = tool?.name ?? input.tool;

  const system = [
    `You are the AI generation engine behind "${toolName}" inside CreateFlow AI,`,
    `an AI content platform. Generate polished, ready-to-use content for the`,
    `user's request. Do not include meta-commentary, disclaimers, or notes`,
    `about being an AI — just produce the requested content directly.`,
    input.brandVoiceContext ? `\nBrand context to stay consistent with:\n${input.brandVoiceContext}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Tool: ${toolName}`,
    `Topic / brief: ${input.topic}`,
    input.tone ? `Tone: ${input.tone}` : null,
    input.language ? `Language: ${input.language}` : null,
    input.length ? `Length: ${input.length}` : null,
    input.keywords ? `Keywords to include naturally: ${input.keywords}` : null,
    input.instructions ? `Additional instructions: ${input.instructions}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export function buildChatSystemPrompt(brandVoiceContext?: string): string {
  return [
    "You are the CreateFlow AI assistant — a helpful, concise creative and",
    "marketing copilot inside the CreateFlow AI platform. Help with writing,",
    "content strategy, SEO, and marketing questions. Keep answers practical",
    "and actionable.",
    brandVoiceContext ? `\nBrand context:\n${brandVoiceContext}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
