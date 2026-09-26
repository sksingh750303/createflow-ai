# CreateFlow AI — Production Architecture

CreateFlow AI is an AI content platform: writing, images, video, social,
and SEO tools, all in one workspace. This build is wired to **real backend
infrastructure** — Firebase Authentication, Firestore, Supabase Storage,
a pluggable AI provider layer, async video generation, and Stripe billing
— behind the original CreateFlow AI frontend (unchanged UI, animations,
dark mode, command palette, etc).

It ships in **mock mode by default** (`AI_MOCK_MODE=true`), so `npm install
&& npm run dev` works immediately with zero external accounts — flip it to
`false` once you've configured the providers below.

> **Sandbox note:** this codebase was authored without network access or
> live credentials, so it has not been `npm install`'d or `npm run build`'d
> here. Run both locally as your first step and fix anything that surfaces
> — the code has been hand-checked for import/type correctness but a real
> build is the actual source of truth.

---

## 1. Architecture

```
Next.js Frontend (React Client Components)
        │  Firebase ID token (Authorization: Bearer …)
        ▼
Next.js Server API Routes (app/api/**)
        │
        ├─ lib/api/auth-guard.ts     verifies the Firebase ID token (Admin SDK)
        ├─ lib/rate-limit.ts          per-user, per-route rate limiting
        ├─ lib/credits.ts             atomic Firestore-transaction credit ledger
        ├─ lib/ai/provider.ts         AI abstraction (mock ⇄ real providers)
        │     ├─ lib/ai/text.ts                    → Hugging Face Inference API (text/chat)
        │     ├─ lib/ai/image.ts                   → Hugging Face Inference API (image)
        │     └─ lib/ai/video-provider.ts           → dispatches to:
        │           ├─ video-provider-huggingface.ts  (default, free, synchronous)
        │           └─ video-provider-replicate.ts     (optional, paid, async + webhook)
        ├─ lib/supabase/server.ts     uploads generated files (service role key)
        └─ lib/firebase/admin.ts      Firestore/Auth Admin SDK (server only)
        ▼
Firebase Firestore (source of truth for all app data)
Supabase Storage (generated images/videos, uploads)
Stripe (subscriptions + one-time credit packs)
```

**Auth = Firebase. Database = Firestore. File storage = Supabase Storage.**
Nothing authoritative lives in `localStorage` anymore — it's used only for
theme, sidebar collapse state, and (optionally) unsaved drafts. See
`lib/storage.ts`.

---

## 2. Install & run locally

```bash
npm install
cp .env.example .env.local   # fill in at least the Firebase block (see §3)
npm run dev
```

Open http://localhost:3000. With only Firebase configured and
`AI_MOCK_MODE=true` (the default), you get: real signup/login, real
per-user Firestore data, real credit tracking — with AI generation
producing local placeholder content instead of calling a paid provider.
This is the fastest way to verify the whole stack before adding paid keys.

Run a production build before shipping:

```bash
npm run build
```

---

## 3. Firebase setup (Authentication + Firestore)

1. Create a project at https://console.firebase.google.com.
2. **Authentication** → Sign-in method → enable **Email/Password** and
   **Google**.
3. **Firestore Database** → Create database (production mode).
4. **Project Settings → General → Your apps** → add a Web app → copy the
   six `NEXT_PUBLIC_FIREBASE_*` values into `.env.local`.
5. **Project Settings → Service accounts** → Generate new private key →
   copy `project_id` / `client_email` / `private_key` into
   `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.
   Keep the `\n` sequences in the private key literal (don't convert to
   real newlines in the env file itself).
6. Deploy security rules + indexes:
   ```bash
   npm install -g firebase-tools   # if you don't have it
   firebase login
   firebase use --add               # pick your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```
7. (Optional but recommended) Enable a **TTL policy** on the `rateLimits`
   collection's `expiresAt` field (Firestore console → TTL) so old rate-
   limit documents get garbage-collected automatically.

**Never commit** the downloaded service-account JSON — only the three
extracted env values belong in `.env.local` / your host's env settings.

---

## 4. Supabase setup (Storage only)

This project intentionally does **not** use Supabase Auth or its Postgres
database — only **Storage**, for generated images/videos and uploads.

1. Create a project at https://supabase.com.
2. **Project Settings → API** → copy the Project URL, `anon` key, and
   `service_role` key into `.env.local`.
3. Open the **SQL Editor** and run `supabase/storage.sql` once — it
   creates the four buckets (`generated-images`, `generated-videos`,
   `user-uploads`, `brand-assets`) as public-read, service-role-write.

Real access control happens in our own API routes (Firebase ID token
check, in `lib/api/auth-guard.ts`) **before** the service-role key is ever
used — see the comment at the top of `supabase/storage.sql` for why the
usual Supabase RLS/`auth.uid()` pattern doesn't apply here.

---

## 5. AI provider setup — single provider (Hugging Face)

Text, chat, image, and video generation all run through **one company,
one API key**: Hugging Face's Inference API. Full step-by-step
walkthrough with screenshotted click-paths: **`docs/SETUP_GUIDE.md`** §3.
Summary:

- **Get a token:** https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained
  → a **fine-grained** token with **"Make calls to Inference Providers"**
  checked (a plain "Read" token is rejected) → `HUGGINGFACE_API_KEY`.
- **Text + chat** (`lib/ai/text.ts`): calls Hugging Face's OpenAI-compatible
  **Chat Completions** endpoint via the official `openai` npm SDK (pointed
  at `baseURL: "https://router.huggingface.co/v1"`), which auto-routes to
  whichever provider currently serves the model — more reliable than the
  older raw text-generation task endpoint, which needs manual per-model
  chat-template formatting. `HF_TEXT_MODEL` defaults to
  `openai/gpt-oss-120b`. Chat streaming is REAL token-by-token streaming
  (`stream: true`, consumed via the SDK's `for await` async iterator over
  the response), not simulated.
- **Images** (`lib/ai/image.ts`): `HF_IMAGE_MODEL` defaults to
  `black-forest-labs/FLUX.1-schnell`, served via the `hf-inference`
  provider's direct model endpoint (`router.huggingface.co/hf-inference/models/…`
  — note this is a different HF endpoint than chat completions; image/video
  aren't (yet) unified under the same router path).
- **Video** (`lib/ai/video-provider-huggingface.ts`, default backend):
  `HF_VIDEO_MODEL` defaults to `ali-vilab/text-to-video-ms-1.7b`. Unlike
  the other two, HF's free tier has no job-queue/webhook system, so this
  backend runs the entire generation synchronously inside the API
  request and uploads straight to Supabase — expect it to be the
  slowest, least reliable piece of the stack (short, low-res clips; the
  model may need to be swapped if deprecated). This is a genuine,
  working integration, not a stub — just not production-grade.
- All three retry automatically on HTTP 503 ("model is warming up"),
  which is normal free-tier behavior, not an error (`lib/ai/huggingface-client.ts`).

**Prefer a more reliable, paid video provider?** Set
`VIDEO_PROVIDER=replicate` to switch `lib/ai/video-provider.ts` over to
`lib/ai/video-provider-replicate.ts` instead — a real async job/webhook
integration against Replicate, kept in the codebase as an opt-in
alternative. See `docs/SETUP_GUIDE.md` §3.5's collapsible section for
that walkthrough. To use a different provider entirely for any of these
three, implement the same function signatures in a new file under
`lib/ai/` — nothing else in the app needs to change.

---

## 6. Payments (Stripe)

1. https://dashboard.stripe.com/apikeys → copy your secret key →
   `STRIPE_SECRET_KEY`.
2. **Product catalog** → create three Products (Creator / Pro / Business),
   each with a **monthly** and a **yearly** recurring Price → copy the six
   Price IDs into the `STRIPE_PRICE_*` env vars (or directly into
   `lib/billing/plans.ts` if you prefer not to use env vars for these).
3. **Developers → Webhooks** → add an endpoint at
   `{APP_URL}/api/webhooks/stripe`, listening for at least
   `checkout.session.completed`, `invoice.paid`, and
   `customer.subscription.deleted` → copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. Test locally with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

One-time credit packs (`/api/billing/credits`) use Stripe's `price_data`
inline rather than pre-created Prices — edit the `CREDIT_PACKS` map in
that route file to change pack sizes/prices.

---

## 7. Database structure (Firestore)

| Collection | Written by | Purpose |
|---|---|---|
| `users/{uid}` | client (bootstrap) + server | profile, plan, credits, role |
| `projects/{id}` | client (owner-scoped) | saved writer/social drafts |
| `generations/{id}` | **server only** | every AI generation + its result |
| `creditTransactions/{id}` | **server only** | full audit trail of every credit change |
| `conversations/{id}` + `messages` subcollection | server (messages), client (title) | AI Chat |
| `notifications/{id}` | server | in-app notification feed |
| `brandKits/{uid}` | client (owner-scoped) | one doc per user |
| `integrations/{uid}` | client (owner-scoped) | connected-app toggle state |
| `files/{id}` | server | Supabase Storage path/URL + ownership metadata |
| `subscriptions/{id}` | server (Stripe webhook) | subscription status snapshot |
| `rateLimits/{id}` | server | internal fixed-window rate-limit counters |

Security rules (`firestore.rules`) enforce: every collection above is
readable only by its owner (or an admin), and the money/credits/
generations collections are **write-only from the Admin SDK** — a client
can never fabricate a completed generation or a credit balance.

---

## 8. Credit system

- Costs are centralized in `lib/billing/plans.ts` → `CREDIT_COSTS`.
- Every `/api/ai/*` route calls `chargeCredits()` (`lib/credits.ts`) in a
  Firestore **transaction** keyed by `generationId` *before* calling the
  provider — so a retried/duplicated request can never double-charge
  (the transaction doc id is deterministic per generation).
- If the provider call then fails, the route calls `refundCredits()`
  (same idempotency pattern) so the user isn't charged for nothing.
- Video is billed up front at job creation; if the async job later fails
  or is cancelled, `lib/ai/video-jobs.ts` → `applyVideoJobResult()`
  refunds automatically — called from both the webhook and the polling
  route, so it works whichever one actually catches the completion.
- Plan upgrades and credit-pack purchases **grant** credits
  (`grantCredits()`), keyed by the Stripe event id, so a retried webhook
  can't double-grant either.

---

## 9. Mock mode

`AI_MOCK_MODE` (default `true`) is read once, server-side, by
`lib/ai/provider.ts` — every route calls into that file, never the mock or
real implementations directly. In mock mode:
- Text/chat: the original local template engine (`lib/mock-ai.ts`).
- Images: a generated SVG gradient placeholder, still uploaded through the
  real Supabase Storage pipeline — so you can verify that whole path works
  before configuring Hugging Face.
- Video: a stateless, timestamp-derived fake job (no server timers) that
  transitions queued → processing → completed over ~9 seconds, resolving
  to a public-domain sample clip — again exercising the *real* async-job
  → Storage → Firestore pipeline end to end.

Set `AI_MOCK_MODE=false` once real provider keys are configured. You can
also leave it `true` in a staging environment to demo the product without
incurring provider costs.

---

## 10. API reference

See `docs/API.md` for the full request/response/error contract of every
route under `app/api/`.




---

## 11. Deployment

Any Node.js host that supports Next.js API routes works (Vercel, Render,
a Node server, etc.):

```bash
npm run build
npm run start
```

Set every env var from `.env.example` in your host's dashboard (never
commit `.env.local`). Point your Stripe and video-provider webhooks at
your real deployed `APP_URL` once it's live.

---

## 12. Troubleshooting

- **"Firebase is not configured"** — you're missing one of the
  `NEXT_PUBLIC_FIREBASE_*` vars; the dashboard shows a setup banner
  instead of crashing.
- **"Firebase Admin is not configured"** (in server logs / API 500s) —
  missing `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` /
  `FIREBASE_PRIVATE_KEY`. Double-check the private key's `\n` sequences
  survived copy-paste into your `.env.local`.
- **Webhook returns 401/500** — `VIDEO_WEBHOOK_SECRET` or
  `STRIPE_WEBHOOK_SECRET` isn't set, or doesn't match what you configured
  on the provider's dashboard. Both webhook routes intentionally refuse
  to process anything without a verifiable signature.
- **Video job stuck at "queued"/"processing"** — either no webhook is
  configured (fine — the page's client-side poll will still finish it
  within ~3s intervals) or `VIDEO_MODEL_VERSION`'s input schema doesn't
  match `buildProviderInput()` in `lib/ai/video-provider.ts`. Check your
  server logs for the provider's actual error response.
- **Credits look wrong** — every change is logged in
  `creditTransactions/{generationId}_debit` /
  `{generationId}_refund` — that collection is the audit trail to
  reconcile from.

