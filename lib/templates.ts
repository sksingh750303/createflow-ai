import { Template } from "@/types";

const g = {
  violet: "from-violet-500/30 to-indigo-500/10",
  blue: "from-blue-500/30 to-cyan-500/10",
  pink: "from-pink-500/30 to-rose-500/10",
  emerald: "from-emerald-500/30 to-teal-500/10",
  amber: "from-amber-500/30 to-orange-500/10",
};

export const templates: Template[] = [
  { id: "tpl-01", name: "SEO Blog Post", description: "Rank-ready blog post with headings, keywords, and meta data.", category: "Blog", toolSlug: "seo-article-writer", gradient: g.violet },
  { id: "tpl-02", name: "How-To Guide", description: "Step-by-step tutorial structure for any topic.", category: "Blog", toolSlug: "ai-blog-writer", gradient: g.blue },
  { id: "tpl-03", name: "Listicle", description: "Numbered list article format that's easy to skim.", category: "Blog", toolSlug: "ai-blog-writer", gradient: g.pink },
  { id: "tpl-04", name: "Product Roundup", description: "Compare and recommend products in one article.", category: "Blog", toolSlug: "article-writer", gradient: g.emerald },
  { id: "tpl-05", name: "Instagram Carousel Caption", description: "Multi-slide caption with hook and CTA.", category: "Social Media", toolSlug: "instagram-caption", gradient: g.pink },
  { id: "tpl-06", name: "LinkedIn Thought Leadership", description: "Professional post that builds authority.", category: "Social Media", toolSlug: "linkedin-post-writer", gradient: g.blue },
  { id: "tpl-07", name: "Twitter Thread", description: "Multi-tweet thread that tells a story.", category: "Social Media", toolSlug: "tweet-generator", gradient: g.violet },
  { id: "tpl-08", name: "Facebook Promo Post", description: "Announcement-style post for offers and launches.", category: "Social Media", toolSlug: "facebook-ad-copy", gradient: g.amber },
  { id: "tpl-09", name: "YouTube Explainer Script", description: "Hook, body and CTA structure for explainer videos.", category: "YouTube", toolSlug: "youtube-script-writer", gradient: g.amber },
  { id: "tpl-10", name: "YouTube Video Title Pack", description: "A batch of high-CTR title variations.", category: "YouTube", toolSlug: "youtube-title-generator", gradient: g.pink },
  { id: "tpl-11", name: "YouTube Shorts Hook", description: "3-second hook script for short-form video.", category: "YouTube", toolSlug: "video-hook-generator", gradient: g.blue },
  { id: "tpl-12", name: "Facebook Ad Set", description: "Primary text, headline, and description for ads.", category: "Marketing", toolSlug: "facebook-ad-copy", gradient: g.violet },
  { id: "tpl-13", name: "Landing Page Hero Copy", description: "Headline, subheading and CTA for a landing page.", category: "Marketing", toolSlug: "landing-page-copy", gradient: g.emerald },
  { id: "tpl-14", name: "Press Release", description: "Formatted announcement for media distribution.", category: "Marketing", toolSlug: "press-release-writer", gradient: g.blue },
  { id: "tpl-15", name: "Brand Tagline Pack", description: "A set of tagline directions for a new brand.", category: "Marketing", toolSlug: "slogan-generator", gradient: g.amber },
  { id: "tpl-16", name: "Cold Outreach Email", description: "Short, personalized outbound email.", category: "Email", toolSlug: "email-writer", gradient: g.violet },
  { id: "tpl-17", name: "Newsletter Issue", description: "Weekly newsletter structure with sections.", category: "Email", toolSlug: "email-writer", gradient: g.blue },
  { id: "tpl-18", name: "Abandoned Cart Email", description: "Recovery email that nudges a completed purchase.", category: "Email", toolSlug: "email-writer", gradient: g.pink },
  { id: "tpl-19", name: "Welcome Email Series", description: "First-touch email for new signups.", category: "Email", toolSlug: "email-writer", gradient: g.emerald },
  { id: "tpl-20", name: "Product Description", description: "Conversion-focused e-commerce product copy.", category: "E-commerce", toolSlug: "product-description", gradient: g.amber },
  { id: "tpl-21", name: "Product Comparison Page", description: "Side-by-side comparison copy for two products.", category: "E-commerce", toolSlug: "product-description", gradient: g.violet },
  { id: "tpl-22", name: "Amazon Listing Copy", description: "Bullet-driven listing copy optimized for marketplaces.", category: "E-commerce", toolSlug: "product-description", gradient: g.blue },
  { id: "tpl-23", name: "Business Plan Outline", description: "Structured plan covering market, model and goals.", category: "Business", toolSlug: "business-plan-generator", gradient: g.emerald },
  { id: "tpl-24", name: "Job Posting", description: "Clear, inclusive job description template.", category: "Business", toolSlug: "job-description-writer", gradient: g.pink },
  { id: "tpl-25", name: "SWOT Analysis", description: "Strengths, weaknesses, opportunities, threats breakdown.", category: "Business", toolSlug: "swot-analysis-generator", gradient: g.amber },
  { id: "tpl-26", name: "Short Story Starter", description: "Creative story premise with characters and setting.", category: "Creative", toolSlug: "story-generator", gradient: g.violet },
  { id: "tpl-27", name: "Brand Name Brainstorm", description: "A batch of original brand name directions.", category: "Creative", toolSlug: "brand-name-generator", gradient: g.blue },
];

export const templateCategories: (Template["category"] | "All")[] = [
  "All",
  "Blog",
  "Social Media",
  "YouTube",
  "Marketing",
  "Email",
  "E-commerce",
  "Business",
  "Creative",
];
