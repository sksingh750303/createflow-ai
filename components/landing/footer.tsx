import Link from "next/link";
import { Sparkles, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "AI Writer", href: "/dashboard/writer" },
      { label: "Image Generator", href: "/dashboard/image" },
      { label: "Video Generator", href: "/dashboard/video" },
      { label: "Templates", href: "/templates" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/tools" },
      { label: "Guides", href: "/tools" },
      { label: "Help Center", href: "/tools" },
      { label: "Prompt Library", href: "/templates" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Contact", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg font-semibold tracking-tight">CreateFlow AI</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One AI workspace to write, design, optimize and publish — for
              creators, marketers and growing teams.
            </p>
            <div className="mt-5 flex gap-3 text-muted-foreground">
              <Twitter className="h-4 w-4" />
              <Instagram className="h-4 w-4" />
              <Linkedin className="h-4 w-4" />
              <Youtube className="h-4 w-4" />
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          © 2026 CreateFlow AI.All rights reserved. <Link href="/terms" className="underline">Terms</Link> · <Link href="/privacy" className="underline">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
