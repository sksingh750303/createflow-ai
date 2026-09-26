// Historically this file also seeded demo projects/history/notifications/
// plans for the LocalStorage-backed mock app. That data now comes from
// Firestore (see lib/firebase/firestore.ts, lib/hooks.ts) and plan
// configuration lives in lib/billing/plans.ts — the only thing left here
// is the static integrations catalog, which is just UI copy, not user data.

export const integrationsList = [
  { id: "google-drive", name: "Google Drive", description: "Save and export your generated content directly to Drive.", icon: "HardDrive" },
  { id: "wordpress", name: "WordPress", description: "Publish AI-generated articles straight to your WordPress site.", icon: "Globe" },
  { id: "notion", name: "Notion", description: "Sync projects and generated docs into your Notion workspace.", icon: "NotebookText" },
  { id: "slack", name: "Slack", description: "Get notified in Slack when a generation completes.", icon: "Slack" },
  { id: "canva", name: "Canva", description: "Send AI-generated copy into your Canva designs.", icon: "Palette" },
  { id: "youtube", name: "YouTube", description: "Push generated titles and descriptions to your channel.", icon: "Youtube" },
  { id: "instagram", name: "Instagram", description: "Schedule AI-generated captions to your Instagram queue.", icon: "Instagram" },
];
