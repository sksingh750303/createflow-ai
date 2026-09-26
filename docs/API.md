# CreateFlow AI — Internal API Reference

All routes below live under `app/api/`, run on the Node.js runtime, and
(except the two webhook routes) require a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

Get one client-side via `getIdToken()` in `lib/firebase/auth.ts`; the
`callApi()` / `streamChatApi()` helpers in `lib/api-client.ts` attach it
automatically. Every response error uses this shape:

```json
{ "error": { "code": "INSUFFICIENT_CREDITS", "message": "…" } }
```

Codes: `AUTH_REQUIRED` (401), `INSUFFICIENT_CREDITS` (402), `INVALID_INPUT`
(400), `FORBIDDEN` (403), `NOT_FOUND` (404), `RATE_LIMITED` (429),
`PROVIDER_ERROR` / `GENERATION_FAILED` / `GENERATION_TIMEOUT` (502/500),
`FILE_UPLOAD_FAILED`, `PAYMENT_FAILED`.

---

## POST /api/ai/text

Writer tools, templates, and SEO analysis (SEO via `kind: "seo"`).

**Request**
```json
{
  "kind": "text",           // or "seo"
  "tool": "ai-blog-writer",
  "topic": "Benefits of remote work",
  "tone": "Professional",
  "language": "English",
  "length": "Medium",
  "keywords": "remote work, productivity",
  "instructions": "Keep it under 400 words",
  "projectId": null
}
```

**Response**
```json
{ "generationId": "abc123", "content": "…", "seo": { "score": 88, "...": "..." } }
```
`seo` is `null` when `kind` is `"text"`.

**Credits:** `CREDIT_COSTS.textGeneration` (15) or `.seoAnalysis` (20).

---

## POST /api/ai/chat

Streaming chat. Returns a `text/plain` stream of the reply (not SSE/JSON) —
consume with `streamChatApi()`. Response header `x-conversation-id` gives
the (possibly newly created) conversation id.

**Request**
```json
{ "conversationId": null, "message": "Give me 3 blog title ideas" }
```

**Credits:** `CREDIT_COSTS.chatMessage` (2) per message, charged before
streaming starts; refunded automatically if the stream errors partway.

---

## POST /api/ai/image

**Request**
```json
{ "prompt": "…", "style": "Realistic", "aspectRatio": "1:1", "quality": "HD", "count": 4, "projectId": null }
```

**Response**
```json
{ "generationId": "abc123", "imageUrls": ["https://….supabase.co/…/0.png", "…"] }
```

**Credits:** `CREDIT_COSTS.imagePerImage` (10) × `count`.

---

## POST /api/ai/social

**Request**
```json
{ "platform": "Instagram", "brand": "Northwind Coffee", "audience": "…", "objective": "Sales", "tone": "Friendly", "topic": "Autumn launch" }
```

**Response**
```json
{ "generationId": "abc123", "post": { "hook": "…", "caption": "…", "cta": "…", "hashtags": ["#…"] } }
```

**Credits:** `CREDIT_COSTS.socialPost` (5).

---

## POST /api/ai/video

Creates an async video generation job (does NOT return the video itself).

**Request**
```json
{
  "mode": "text-to-video",
  "prompt": "…",
  "duration": "0:30",
  "aspectRatio": "16:9",
  "style": "Cinematic",
  "cameraMovement": "Pan",
  "voice": "None",
  "music": "Upbeat",
  "sourceImageUrl": null,
  "projectId": null
}
```

**Response**
```json
{ "generationId": "abc123", "status": "queued" }
```

**Credits:** `CREDIT_COSTS.videoGeneration` (50), charged up front;
refunded automatically if the job later fails/is cancelled.

---

## GET /api/ai/video/status?generationId=abc123

Polls the provider (if the job isn't already terminal) and applies any
status change to Firestore — safe to call repeatedly; also the mechanism
the video page uses as a webhook fallback.

**Response**
```json
{ "status": "processing", "videoUrl": null, "errorMessage": null, "progress": 40 }
```
`status` is one of `queued | processing | completed | failed | cancelled`.

---

## POST /api/webhooks/video

Provider callback — **not** called by the frontend. Requires a valid
signature (see `VIDEO_WEBHOOK_SECRET` in `.env.example`); unsigned or
invalid requests are rejected with 401. Idempotent per job id.

---

## POST /api/billing/checkout

**Request**
```json
{ "planId": "pro", "billingCycle": "monthly" }
```

**Response**
```json
{ "url": "https://checkout.stripe.com/…" }
```
Redirect the browser to `url`. Requires the corresponding
`STRIPE_PRICE_*` env var to be set for that plan/cycle.

---

## POST /api/billing/credits

**Request**
```json
{ "packId": "medium" }
```

**Response**
```json
{ "url": "https://checkout.stripe.com/…" }
```

---

## POST /api/webhooks/stripe

Stripe callback — **not** called by the frontend. Requires a valid
`stripe-signature` header verified against `STRIPE_WEBHOOK_SECRET`.
Handles `checkout.session.completed` (plan upgrade or credit pack),
`invoice.paid` (monthly credit renewal), `customer.subscription.deleted`
(downgrade to free).
