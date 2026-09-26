// Mock AI generation engine.
// No external APIs are called. Every function below produces deterministic-ish,
// template-based "demo generation" content locally, with a realistic delay.

export const GENERATION_STAGES: Record<string, string[]> = {
  text: ["Analyzing request", "Creating outline", "Generating content", "Optimizing result", "Finishing"],
  image: ["Reading prompt", "Composing scene", "Rendering details", "Upscaling", "Finishing"],
  video: ["Preparing scenes", "Generating visuals", "Applying motion", "Adding audio", "Rendering video"],
  social: ["Understanding brand", "Drafting hook", "Writing caption", "Adding hashtags", "Finishing"],
  seo: ["Analyzing keyword", "Researching intent", "Structuring content", "Scoring SEO", "Finishing"],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const openers = [
  "In a world where attention is the scarcest resource, {topic} deserves more than a passing thought.",
  "If you've been putting off {topic}, this is the sign to finally tackle it.",
  "Here's what most people get wrong about {topic} — and how to get it right.",
  "{topic} isn't complicated once you break it into the right steps.",
  "Let's cut through the noise and talk plainly about {topic}.",
];

const bodyChunks = [
  "Start with the fundamentals: clarity beats cleverness every time. Define the outcome you actually want before choosing tactics.",
  "The biggest mistake teams make is optimizing for activity instead of outcomes. Track the metric that matters, not the one that's easiest to measure.",
  "Consistency compounds. Small, repeatable actions taken weekly outperform occasional bursts of intense effort.",
  "Your audience can tell when something is generic. Specificity — real numbers, real examples, real language — is what earns trust.",
  "Iteration is the whole game. Ship a rough version, gather signal, and refine it based on what actually happens, not what you assumed would happen.",
  "Don't underestimate the compounding value of a strong first impression. The opening line decides whether anyone reads the second one.",
];

const closers = [
  "The takeaway: start small, measure honestly, and let the results tell you what to do next.",
  "None of this requires more hours in the day — it requires better decisions about where those hours go.",
  "Put one of these ideas into practice this week and you'll already be ahead of most people who only read about it.",
  "That's the whole framework. Simple to understand, and — like most good advice — still takes discipline to execute.",
];

function fillTemplate(template: string, topic: string) {
  return template.replaceAll("{topic}", topic || "this");
}

export interface GenerateTextInput {
  topic: string;
  tone?: string;
  language?: string;
  length?: string;
  keywords?: string;
  instructions?: string;
  toolName?: string;
}

export async function generateText(input: GenerateTextInput): Promise<string> {
  const paragraphCount = input.length === "Long" ? 5 : input.length === "Short" ? 2 : 3;
  await delay(400);

  const parts: string[] = [];
  parts.push(fillTemplate(pick(openers), input.topic));

  const shuffled = [...bodyChunks].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.max(1, paragraphCount - 1); i++) {
    parts.push(shuffled[i % shuffled.length]);
  }
  parts.push(pick(closers));

  const toneNote = input.tone ? ` Written in a ${input.tone.toLowerCase()} tone.` : "";
  const keywordNote = input.keywords
    ? `\n\nKeywords woven in: ${input.keywords}.`
    : "";

  return `${parts.join("\n\n")}${keywordNote}\n\n— Demo generation${toneNote}`;
}

export interface GeneratedImage {
  id: string;
  gradient: string;
  label: string;
}

const imageGradients = [
  "from-violet-500 via-fuchsia-500 to-indigo-600",
  "from-blue-500 via-cyan-400 to-teal-500",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-pink-500 via-rose-500 to-orange-400",
  "from-indigo-600 via-purple-500 to-pink-500",
];

export async function generateImage(prompt: string, count = 4): Promise<GeneratedImage[]> {
  await delay(400);
  const shuffled = [...imageGradients].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }).map((_, i) => ({
    id: `img_${Date.now()}_${i}`,
    gradient: shuffled[i % shuffled.length],
    label: prompt ? `${prompt.slice(0, 28)}${prompt.length > 28 ? "…" : ""}` : "Demo generation",
  }));
}

export interface GeneratedVideo {
  id: string;
  gradient: string;
  duration: string;
  label: string;
}

export async function generateVideo(prompt: string, duration = "0:30"): Promise<GeneratedVideo> {
  await delay(400);
  return {
    id: `vid_${Date.now()}`,
    gradient: pick(imageGradients),
    duration,
    label: prompt || "Demo generation",
  };
}

export interface SocialPost {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export async function generateSocialPost(input: {
  brand: string;
  audience?: string;
  objective?: string;
  tone?: string;
  topic: string;
  platform: string;
}): Promise<SocialPost> {
  await delay(400);
  const hook = `Stop scrolling — here's why ${input.topic || "this"} matters right now.`;
  const caption = `${input.brand ? input.brand + ": " : ""}${fillTemplate(pick(openers), input.topic)} ${pick(bodyChunks)}`;
  const cta =
    input.objective === "Sales"
      ? "Shop the link in bio before it's gone."
      : input.objective === "Awareness"
      ? "Share this with someone who needs to see it."
      : "Drop a comment and let us know what you think.";
  const baseTags = ["#createflowai", "#demogeneration"];
  const topicTag = (input.topic || "content").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const platformTag = `#${input.platform.toLowerCase().replace(/\s+/g, "")}`;
  return {
    hook,
    caption,
    cta,
    hashtags: [...baseTags, `#${topicTag}`, platformTag].filter(Boolean),
  };
}

export interface SEOResult {
  content: string;
  score: number;
  readability: number;
  keywordUsage: number;
  headingStructure: number;
  metaData: number;
  contentLength: number;
}

export async function generateSEOContent(input: GenerateTextInput): Promise<SEOResult> {
  const content = await generateText(input);
  const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));
  return {
    content,
    score: rand(78, 97),
    readability: rand(70, 98),
    keywordUsage: rand(65, 95),
    headingStructure: rand(80, 100),
    metaData: rand(70, 100),
    contentLength: rand(75, 100),
  };
}

export { delay as mockDelay };
