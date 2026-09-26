import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { AnnouncementBar, Hero } from "@/components/landing/hero";
import { TrustSection } from "@/components/landing/trust-section";
import { AiToolsSection } from "@/components/landing/ai-tools-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { TemplatesPreviewSection, FinalCta } from "@/components/landing/misc-sections";
import { FaqSection } from "@/components/landing/faq-section";
import { PricingTable } from "@/components/pricing/pricing-table";

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <AiToolsSection />

        <FeatureSection
          eyebrow="AI Writer"
          title="Long-form content, written in your voice"
          description="Generate blog posts, articles and marketing copy — then rewrite, expand, or change the tone with one click."
          bullets={[
            "Blog posts, articles, and product copy",
            "Rewrite, expand, shorten & fix grammar",
            "Brand-voice aware generation",
          ]}
          cta="Try AI Writer"
          href="/dashboard/writer"
          icon="PenLine"
          accent="from-violet-500/20 to-indigo-500/5"
        />
        <FeatureSection
          eyebrow="AI Image"
          title="Turn a prompt into on-brand visuals"
          description="Generate images in seconds across styles, aspect ratios and resolutions — perfect for blog headers, ads and social."
          bullets={[
            "7 visual styles from realistic to 3D",
            "Multiple aspect ratios for every platform",
            "Upscale, remix or download instantly",
          ]}
          cta="Try AI Image"
          href="/dashboard/image"
          icon="ImageIcon"
          reverse
          accent="from-blue-500/20 to-cyan-500/5"
        />
        <FeatureSection
          eyebrow="AI Video"
          title="From idea to finished video, faster"
          description="Describe a scene, upload an image, or paste a script — CreateFlow AI handles scenes, motion, voice and music."
          bullets={[
            "Text-to-video, image-to-video & script-to-video",
            "Control camera movement, voice and music",
            "Full timeline preview and export",
          ]}
          cta="Try AI Video"
          href="/dashboard/video"
          icon="Video"
          accent="from-amber-500/20 to-orange-500/5"
        />
        <FeatureSection
          eyebrow="Social Media"
          title="Plan and generate a full content calendar"
          description="Generate hooks, captions, CTAs and hashtags for every platform — then drop them into a visual weekly calendar."
          bullets={[
            "Instagram, LinkedIn, X, Facebook & YouTube",
            "Hook, caption, CTA and hashtags in one pass",
            "Drag-friendly weekly content calendar",
          ]}
          cta="Try Social Media AI"
          href="/dashboard/social"
          icon="Megaphone"
          reverse
          accent="from-pink-500/20 to-rose-500/5"
        />
        <FeatureSection
          eyebrow="SEO Toolkit"
          title="Content that's built to rank"
          description="Get keyword clusters, meta data, content briefs and a live SEO score — all from one keyword."
          bullets={[
            "SEO score, readability & keyword usage",
            "Meta titles, descriptions & schema markup",
            "Content briefs ready for any writer",
          ]}
          cta="Try SEO Toolkit"
          href="/dashboard/seo"
          icon="TrendingUp"
          accent="from-emerald-500/20 to-teal-500/5"
        />
        <FeatureSection
          eyebrow="Website Copy"
          title="Launch your website copy in minutes"
          description="Generate homepage, landing page and product copy that matches your brand voice, ready to paste into any site builder."
          bullets={[
            "Hero, feature and CTA sections",
            "Consistent with your saved Brand Kit",
            "Export or copy straight to your CMS",
          ]}
          cta="Generate website copy"
          href="/tools/website-copy-generator"
          icon="Globe"
          reverse
          accent="from-cyan-500/20 to-blue-500/5"
        />

        <TemplatesPreviewSection />
        <WorkflowSection />

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade anytime as your creative work grows.
            </p>
          </div>
          <div className="mt-10">
            <PricingTable />
          </div>
        </section>

        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
