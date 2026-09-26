import "server-only";

// Server-only Supabase client using the SERVICE ROLE key. This bypasses
// Supabase Storage RLS policies entirely, exactly like the Firebase Admin
// SDK bypasses Firestore rules — so it must only ever be used from trusted
// server code (API routes / webhook handlers) that has already verified
// the caller's Firebase ID token and ownership of the resource.

import { SupabaseClient, createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseAdminConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

let adminClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY (see .env.example). Find these under " +
        "Project Settings → API in your Supabase dashboard."
    );
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export const STORAGE_BUCKETS = {
  images: "generated-images",
  videos: "generated-videos",
  uploads: "user-uploads",
  brandAssets: "brand-assets",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Uploads a buffer to Supabase Storage and returns its public URL + path.
 * Buckets are expected to already exist (create them once in the Supabase
 * dashboard or via the SQL in supabase/storage.sql) with the policies from
 * that file applied.
 */
export async function uploadToSupabaseStorage(params: {
  bucket: StorageBucket;
  path: string; // e.g. `${uid}/${generationId}/0.png`
  data: Buffer | Uint8Array | ArrayBuffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ path: string; publicUrl: string; bucket: string }> {
  const supabase = getClient();
  const { bucket, path, data, contentType, upsert = false } = params;

  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl: publicUrlData.publicUrl, bucket };
}

/** Uploads a remote file (e.g. a provider-hosted image/video URL) into Supabase Storage. */
export async function uploadRemoteFileToSupabase(params: {
  bucket: StorageBucket;
  path: string;
  sourceUrl: string;
  contentType?: string;
}): Promise<{ path: string; publicUrl: string; bucket: string }> {
  const res = await fetch(params.sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source file (${res.status}) from provider.`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType =
    params.contentType || res.headers.get("content-type") || "application/octet-stream";

  return uploadToSupabaseStorage({
    bucket: params.bucket,
    path: params.path,
    data: arrayBuffer,
    contentType,
    upsert: true,
  });
}

export async function deleteFromSupabaseStorage(bucket: StorageBucket, path: string) {
  const supabase = getClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}
