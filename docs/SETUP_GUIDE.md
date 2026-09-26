# CreateFlow AI — Complete API Connection Guide

One file, start to finish: every external service this app talks to, exactly
where to click to get each credential, and exactly which `.env.local`
variable it goes into. Do the sections in order — each one builds on the
last, and the app is testable after every section instead of only at the
very end.

**Services covered:** Firebase (Auth + Database) → Supabase (File Storage)
→ Hugging Face — one provider for Text/Chat/Image/Video AI → Stripe
(Payments). An optional paid Replicate video path is included as a
fallback if you outgrow Hugging Face's free video models.

---

## 0. Before you start

1. Copy the env template so you have somewhere to paste credentials as you go:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor and keep it open — every step below tells
   you exactly which line(s) to fill in.
3. `.env.local` is already in `.gitignore` — never commit it, and never paste
   real keys into a file that isn't `.env.local` / your host's env settings.
4. Install dependencies once, up front:
   ```bash
   npm install
   ```

---

## 1. Firebase — Authentication + Database

Firebase is this app's identity provider and database. Nothing works
(signup, login, dashboard, credits) until this section is done.

### 1.1 Create the project
1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Add project** → name it (e.g. `createflow-ai`) → you can disable
   Google Analytics for this project (not needed) → **Create project**.

### 1.2 Turn on sign-in methods
1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → click **Email/Password** → toggle it **Enable** → **Save**.
3. Still on that tab → click **Google** → toggle **Enable** → pick a support
   email → **Save**.

### 1.3 Create the database
1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Choose a location close to your users (can't be changed later) → **Next**.
3. Select **Start in production mode** → **Create**. (This app ships its own
   `firestore.rules`, deployed in step 1.6 — production mode just means
   Firebase won't use its own wide-open default rules in the meantime.)

### 1.4 Get the client (public) config
1. Click the **⚙️ gear icon** next to "Project Overview" → **Project settings**.
2. Scroll to **Your apps** → click the **</>** (web) icon to register a new
   web app → name it anything (e.g. `createflow-web`) → **Register app**.
   (Skip the "Firebase Hosting" checkbox — not used here.)
3. Firebase shows a `firebaseConfig` object. Copy each value into `.env.local`:

   | Firebase shows this key | Paste into this env var |
   |---|---|
   | `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
   | `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
   | `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
   | `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

   These six are safe to expose to the browser — they identify your project,
   they don't grant access by themselves (Firestore's rules do that).

### 1.5 Get the server (Admin SDK) credential
1. Still in **Project settings** → **Service accounts** tab.
2. Click **Generate new private key** → confirm → a `.json` file downloads.
3. **Do not commit this file anywhere.** Open it and copy three fields into `.env.local`:

   | JSON field | Paste into this env var |
   |---|---|
   | `project_id` | `FIREBASE_PROJECT_ID` |
   | `client_email` | `FIREBASE_CLIENT_EMAIL` |
   | `private_key` | `FIREBASE_PRIVATE_KEY` |

   The private key value looks like `"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"`.
   Paste it exactly as-is, **keep the `\n` characters literal** (don't turn
   them into real line breaks) — wrap the whole value in quotes if your env
   file format needs it. `lib/firebase/admin.ts` converts the `\n`s back to
   real newlines automatically.
4. Delete the downloaded `.json` file once you've copied the three values
   (or move it somewhere outside the project folder, well away from git).

### 1.6 Deploy the security rules and indexes
This app ships `firestore.rules` and `firestore.indexes.json` already
written for it — you just need to push them to your project:
```bash
npm install -g firebase-tools   # one-time, if you don't have the CLI
firebase login
firebase use --add               # pick the project you just created
firebase deploy --only firestore:rules,firestore:indexes
```

### 1.7 Test it
```bash
npm run dev
```
Go to `/signup`, create an account. If it redirects to `/dashboard` and
shows credits in the sidebar, Firebase Auth + Firestore are both working.
(The banner "Firebase isn't configured yet" means one of the steps above
is missing an env var — check `.env.local` again.)

---

## 2. Supabase — File Storage

Supabase is used for **one thing only**: storing generated images and
videos. It is not used for auth or a database in this app (Firebase does
those) — so skip Supabase's usual "connect Supabase Auth" instructions
anywhere else you might have seen them.

### 2.1 Create the project
1. Go to **https://supabase.com** → sign in → **New project**.
2. Pick an organization, name it (e.g. `createflow-ai`), set a database
   password (you won't need it for this app, but Supabase requires one),
   pick a region → **Create new project**. Wait ~1-2 minutes for it to spin up.

### 2.2 Get the API credentials
1. Left sidebar → **Project Settings** (gear icon) → **API**.
2. Copy these into `.env.local`:

   | Supabase shows this | Paste into this env var |
   |---|---|
   | **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon / public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role** key (click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY` |

   The `service_role` key bypasses all storage security rules — treat it
   like a password. It's only ever used server-side in this app (see
   `lib/supabase/server.ts`), never sent to the browser.

### 2.3 Create the storage buckets
1. Left sidebar → **SQL Editor** → **New query**.
2. Open the file `supabase/storage.sql` from this project, paste its
   entire contents into the query editor, and click **Run**.
3. This creates four public-read buckets (`generated-images`,
   `generated-videos`, `user-uploads`, `brand-assets`) and locks writes to
   the service-role key only. Verify under **Storage** in the sidebar — you
   should see all four buckets listed.

### 2.4 Test it
With `AI_MOCK_MODE=true` (the default) and step 1 done, go to
`/dashboard/image`, enter a prompt, click **Generate**. You should see
placeholder gradient images appear — open Supabase → **Storage →
generated-images** and you'll find the uploaded files there, proving the
whole upload pipeline works even before you add a real image provider.

---

## 3. Hugging Face — Text, Chat, Image & Video AI (single provider)

This app is set up to use **one company, one API key** for all AI
generation — text, chat, image, and (experimentally) video — via the
Hugging Face Inference API and its free serverless tier.

### 3.1 Get an API token
1. Go to **https://huggingface.co** → sign up / sign in (free account).
2. Go directly to
   **https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained**
   (this pre-selects the right permission) — or navigate manually: top-right
   avatar → **Settings → Access Tokens → Create new token → Fine-grained**.
3. Under **Permissions**, make sure **"Make calls to Inference Providers"**
   is checked. This is required — a plain old-style "Read" token is **not**
   enough for Hugging Face's current Inference Providers routing and will
   get rejected.
4. Name it (e.g. `createflow-ai`) → **Create token** → copy it immediately.
5. Paste it into `.env.local`:
   ```
   HUGGINGFACE_API_KEY=hf_...
   ```
   That one key powers text, chat, image, and video below — nothing else
   to sign up for.

> **Endpoint note:** this app calls Hugging Face at
> `https://router.huggingface.co/hf-inference/...` — Hugging Face retired
> their older `api-inference.huggingface.co` host, so if you're reading
> code/docs elsewhere that still reference it, it's outdated; the code in
> this project already uses the current one.

### 3.2 Turn off mock mode
In `.env.local`:
```
AI_MOCK_MODE=false
```
This flips text, chat, image, AND video over to Hugging Face all at once
(one switch controls all of them — see the note at the end of this guide
if you want to phase them in one at a time instead).

### 3.3 Text & chat (AI Writer, SEO/Social tools, AI Chat)
Nothing else required — `.env.example` already sets a working default:
```
HF_TEXT_MODEL=openai/gpt-oss-120b
```
This is a free-tier-friendly chat model that works immediately with just
the token from step 3.1 — CreateFlow AI talks to it through Hugging
Face's OpenAI-compatible **Chat Completions** endpoint
(`router.huggingface.co/v1/chat/completions`), which auto-selects a
backing provider for you, so you don't need to know or care which
company actually runs the model. If you'd rather use a different one,
browse **https://router.huggingface.co/v1/models** (or call `GET` that
URL yourself), copy its model id (the `org/model-name`), and set
`HF_TEXT_MODEL` to that. Some popular models (e.g. Meta's Llama family)
are "gated": click **Agree and access repository** on that model's page
on huggingface.co while logged in before your token can use it.

**Test it:** restart `npm run dev`, go to `/dashboard/chat`, ask something
like "what is AI?". You should get back a real, direct written
explanation — not templated placeholder text — within a few seconds,
streaming in as it's generated.

### 3.4 Image (`/dashboard/image`)
Also works with the default out of the box:
```
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
```
FLUX.1-schnell is fast, free-tier friendly, and Apache-2.0 licensed. To
use a different model, browse
**https://huggingface.co/models?pipeline_tag=text-to-image** and set
`HF_IMAGE_MODEL` to its id the same way as above.

**Test it:** go to `/dashboard/image`, generate an image. A real
generated image should appear (again, allow ~10-20s on a cold model) and
get uploaded to your Supabase `generated-images` bucket automatically.

### 3.5 Video (`/dashboard/video`) — read this one carefully
Video is the one place "free" gets genuinely limited — **no provider,
including Hugging Face, offers a robust free tier for video generation**
(it's just expensive to run). This app's Hugging Face video path is real
and wired end-to-end, but expect short, low-resolution, sometimes-flaky
clips — treat it as a demo-quality integration, not production-grade.

1. Nothing to sign up for — it reuses `HUGGINGFACE_API_KEY` from step 3.1.
2. The default model is already set:
   ```
   VIDEO_PROVIDER=huggingface
   HF_VIDEO_MODEL=ali-vilab/text-to-video-ms-1.7b
   ```
3. If that model has been deprecated or is unavailable by the time you
   read this (free-tier video model availability changes often), browse
   **https://huggingface.co/models?pipeline_tag=text-to-video**, pick
   another one, and update `HF_VIDEO_MODEL` to its id.
4. **Test it:** go to `/dashboard/video`, describe a video, click
   **Generate**. Unlike text/image, this one call does the *entire*
   generation before responding (Hugging Face's free tier doesn't have a
   job-queue/webhook system like paid providers do), so expect the
   request to take a while — the button shows a loading state the whole
   time, then the finished video appears.
5. **If it keeps failing or timing out:** free video models are the
   least reliable piece of this stack. You have two fallbacks, both
   already built in:
   - Leave `AI_MOCK_MODE=true` just for testing everything else, and
     come back to video later.
   - Or set `VIDEO_PROVIDER=replicate` to switch to a paid, genuinely
     asynchronous provider instead — see the "Want a more reliable paid
     video provider instead?" section below for that path.

<details>
<summary><strong>Want a more reliable paid video provider instead? (optional, not single-company)</strong></summary>

If Hugging Face's free video models aren't cutting it, this project also
ships a second, more capable video backend using Replicate's async job +
webhook system (paid, pay-per-run, much wider model selection, more
reliable). This is intentionally optional and off by default, since it
means a second company/API key instead of one — turn to it only if you
decide free video isn't good enough for your use case.

1. **https://replicate.com** → sign in → **Account → API tokens** → copy
   a token into `.env.local` as `VIDEO_API_KEY=r8_...`. Add a payment
   method under **Account → Billing**.
2. Browse **https://replicate.com/explore**, pick a video model, open its
   **API** tab, copy the **version id** into `VIDEO_MODEL_VERSION=...`.
3. Still on that API tab, note the exact `input` field names the model
   expects, then open `lib/ai/video-provider-replicate.ts` →
   `buildProviderInput()` and adjust the field names to match.
4. Set `VIDEO_PROVIDER=replicate` in `.env.local`.
5. Optional webhook for near-instant completion instead of polling: set
   `VIDEO_WEBHOOK_SECRET` to a random string (`openssl rand -hex 32`),
   set `APP_URL` to your real public URL, and verify the signature check
   in `app/api/webhooks/video/route.ts` against
   **https://replicate.com/docs/webhooks** before trusting it in
   production. Skipping this just means the app relies on its automatic
   status polling instead, which still works fine.

</details>

---

## 4. Stripe — Payments (subscriptions + credit packs)

Powers `/pricing`, `/dashboard/billing`, and plan upgrades.

### 4.1 Get your API keys
1. Go to **https://dashboard.stripe.com** → sign in (use **test mode** —
   toggle in the top-right — while setting this up).
2. **Developers → API keys** → copy the **Secret key** → paste into `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 4.2 Create your plans as Stripe Products
1. **Product catalog** (left sidebar, or **https://dashboard.stripe.com/products**)
   → **Add product**.
2. Create three products: **Creator**, **Pro**, **Business**. For each one,
   add two **recurring prices**: one **Monthly**, one **Yearly** (use the
   dollar amounts from `lib/billing/plans.ts` in this project, or your own).
3. After saving each price, click into it and copy its **Price ID**
   (starts with `price_...`) into the matching `.env.local` line:
   ```
   STRIPE_PRICE_CREATOR_MONTHLY=price_...
   STRIPE_PRICE_CREATOR_YEARLY=price_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_YEARLY=price_...
   STRIPE_PRICE_BUSINESS_MONTHLY=price_...
   STRIPE_PRICE_BUSINESS_YEARLY=price_...
   ```
   (You can skip whichever plans you don't need yet — upgrading to a plan
   with no price id configured will show a clear error instead of failing silently.)

### 4.3 Set up the webhook
This is what actually applies the upgrade/credits after checkout succeeds.

**For local development**, use the Stripe CLI instead of the dashboard
(dashboard webhooks need a public URL):
```bash
# one-time install: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
This prints a webhook signing secret starting with `whsec_...` — paste it into `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```
Leave `stripe listen` running in a terminal while you test.

**For production**, instead: **Developers → Webhooks → Add endpoint** →
URL = `https://your-deployed-domain.com/api/webhooks/stripe` → select
events **checkout.session.completed**, **invoice.paid**,
**customer.subscription.deleted** → **Add endpoint** → copy its **Signing
secret** into your production environment's `STRIPE_WEBHOOK_SECRET`.

### 4.4 Test it
1. With `stripe listen` running, go to `/pricing`, click upgrade on a plan.
2. You'll land on a real Stripe Checkout page — use Stripe's test card
   `4242 4242 4242 4242`, any future expiry date, any CVC.
3. After paying, you should land back on `/dashboard/billing` with your
   plan and credits updated — check the terminal running `stripe listen`
   to see the webhook events arriving.

---

## Putting it all together

Once every section above is done, your `.env.local` should have every
value filled in, and:
```
AI_MOCK_MODE=false
```
Restart the dev server, and every tool in the app is now backed by real
Hugging Face generation instead of the local mock engine — text, chat,
image, and video, all from that one `HUGGINGFACE_API_KEY`.

**Testing incrementally instead of all at once?** `AI_MOCK_MODE` is
all-or-nothing across text/image/video by design (one flag, one place —
`lib/ai/provider.ts`) — but since it's a single provider now, there's
usually nothing to phase in: one token unlocks all three. If you
specifically want real text now but still-mock image/video (e.g. while
you sort out a video model), that requires a small code change: in
`lib/ai/provider.ts`, replace the single `isMockMode()` check with
per-feature env flags (e.g. `TEXT_MOCK_MODE`, `IMAGE_MOCK_MODE`,
`VIDEO_MOCK_MODE`) and check the right one in each function.

**Going to production:** set every `.env.local` value in your hosting
provider's environment variable settings instead (never deploy the file
itself), update `APP_URL` to your real domain, and — if you're using
Stripe and/or the optional Replicate video path — switch their webhook
endpoints to point at that domain instead of `localhost`.
