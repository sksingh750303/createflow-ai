-- CreateFlow AI — Supabase Storage setup
-- Run this once in your Supabase project's SQL editor (Database → SQL Editor).
--
-- IMPORTANT CONTEXT: this project's auth system of record is FIREBASE
-- Authentication, not Supabase Auth — Supabase is used purely as a file
-- store. That means Supabase's usual `auth.uid()` based RLS policies
-- (which assume Supabase Auth issued the session) do NOT apply here.
-- Every upload/delete goes through our own Next.js API routes using the
-- SUPABASE SERVICE ROLE KEY (lib/supabase/server.ts), which bypasses
-- Storage RLS entirely — the real access control is our Firebase-ID-token
-- check in lib/api/auth-guard.ts, BEFORE any Supabase call happens.
--
-- The policies below are a defense-in-depth backstop for the buckets'
-- default (anon-key) access, not the primary security boundary:
--   - Public READ (anyone with the URL can view/download a generated
--     image or video) — matches this app's UI, which renders images and
--     the video player directly from the public URL.
--   - NO writes/deletes from the anon key at all — only the service role
--     key (server-side) can upload or delete, which is enforced simply by
--     not granting insert/update/delete to `anon`/`authenticated` below.

-- 1. Create the buckets (id must match STORAGE_BUCKETS in lib/supabase/server.ts)
insert into storage.buckets (id, name, public)
values
  ('generated-images', 'generated-images', true),
  ('generated-videos', 'generated-videos', true),
  ('user-uploads', 'user-uploads', true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- 2. Public read access for all four buckets.
create policy "Public read - generated-images"
  on storage.objects for select
  using (bucket_id = 'generated-images');

create policy "Public read - generated-videos"
  on storage.objects for select
  using (bucket_id = 'generated-videos');

create policy "Public read - user-uploads"
  on storage.objects for select
  using (bucket_id = 'user-uploads');

create policy "Public read - brand-assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

-- 3. Deliberately NO insert/update/delete policies for `anon` or
-- `authenticated` roles — uploads and deletes only ever happen via the
-- service role key from our server code, which bypasses RLS by design.
-- If you later want authenticated end users to upload directly from the
-- browser (skipping our API routes), add scoped insert policies here,
-- e.g. restricting the object path prefix to a value only that Supabase
-- Auth user could produce — but note that requires actually adopting
-- Supabase Auth (or a custom JWT bridge from Firebase), which this
-- project does not currently do.

-- 4. Recommended: a lifecycle/cleanup job (Supabase doesn't auto-expire
-- storage objects) — periodically reconcile the `files` Firestore
-- collection against orphaned objects if generations/projects are
-- deleted, e.g. via a scheduled Cloud Function or Supabase Edge Function.
