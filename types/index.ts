export type ToolCategory =
  | "Writing"
  | "SEO"
  | "Marketing"
  | "Social Media"
  | "YouTube"
  | "Images"
  | "Video"
  | "Business"
  | "Coding";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string; // lucide-react icon name
  credits: number;
  fields: ToolField[];
}

export interface ToolField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "keywords";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export type TemplateCategory =
  | "Blog"
  | "Social Media"
  | "YouTube"
  | "Marketing"
  | "Email"
  | "E-commerce"
  | "Business"
  | "Creative";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  toolSlug: string;
  gradient: string;
}

export type GenerationType =
  | "Writing"
  | "Images"
  | "Video"
  | "Social"
  | "SEO";

export interface Generation {
  id: string;
  type: GenerationType;
  title: string;
  prompt: string;
  content: string;
  createdAt: string;
  creditsUsed: number;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  ownerId?: string;
  projectId?: string | null;
  /** Firebase Storage download URLs for image generations. */
  imageUrls?: string[];
  /** Firebase Storage download URL for a completed video generation. */
  videoUrl?: string;
  /** Provider job id, used to correlate async video jobs with webhooks. */
  providerJobId?: string;
  errorMessage?: string;
}

export interface Project {
  id: string;
  name: string;
  type: GenerationType;
  updatedAt: string;
  status: "draft" | "in-progress" | "completed";
  content?: string;
  ownerId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "success" | "info" | "warning";
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  features: string[];
  highlighted?: boolean;
}

export interface User {
  name: string;
  email: string;
  plan: string;
  credits: number;
  avatar?: string;
  createdAt: string;
}

export interface BrandKit {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  description: string;
  voice: string;
  audience: string;
}

// ---------------------------------------------------------------------
// Server-side / Firestore-backed types (production architecture)
// ---------------------------------------------------------------------

export type PlanId = "free" | "creator" | "pro" | "business";

export interface UserDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: PlanId;
  credits: number;
  lifetimeCreditsUsed: number;
  monthlyCreditsUsed: number;
  role: "user" | "admin";
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown; // Firestore Timestamp
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  preferences?: {
    emailNotifications?: boolean;
    productUpdates?: boolean;
    generationCompletionAlerts?: boolean;
  };
}

export interface CreditTransaction {
  id: string;
  userId: string;
  generationId: string | null;
  type: "debit" | "credit" | "refund" | "purchase" | "plan_grant";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: unknown; // Firestore Timestamp
}

export interface ConversationDoc {
  id: string;
  ownerId: string;
  title: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface MessageDoc {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: unknown;
}

export interface FileDoc {
  id: string;
  ownerId: string;
  generationId?: string;
  projectId?: string | null;
  /** Path inside the Supabase Storage bucket, e.g. "userId/generationId/0.png". */
  storagePath: string;
  bucket: string;
  publicUrl?: string;
  mimeType: string;
  size: number;
  createdAt: unknown;
}

export interface SubscriptionDoc {
  id: string;
  ownerId: string;
  plan: PlanId;
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export type VideoJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface AiErrorPayload {
  code:
    | "AUTH_REQUIRED"
    | "INSUFFICIENT_CREDITS"
    | "INVALID_INPUT"
    | "PROVIDER_ERROR"
    | "RATE_LIMITED"
    | "GENERATION_FAILED"
    | "GENERATION_TIMEOUT"
    | "FILE_UPLOAD_FAILED"
    | "PAYMENT_FAILED"
    | "NOT_FOUND"
    | "FORBIDDEN";
  message: string;
}
