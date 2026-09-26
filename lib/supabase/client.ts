"use client";

// This project uses Supabase for ONE thing only: file storage (generated
// images/videos and user uploads). Auth and the database are Firebase
// (Firebase Authentication + Firestore) — see lib/firebase/*.
//
// The browser client below uses the public anon key and is only used for
// reading/downloading public files. Uploading generated AI assets always
// happens server-side (lib/supabase/server.ts) using the service role key,
// gated by our own Firebase-Auth-checked API routes — never directly from
// the client with elevated privileges.

import { SupabaseClient, createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)."
    );
  }
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false }, // Firebase owns the session, not Supabase.
    });
  }
  return client;
}

/** Public URL for a file in a public bucket (images/videos are served publicly by URL). */
export function getSupabasePublicUrl(bucket: string, path: string): string {
  const supabase = getSupabaseBrowserClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
