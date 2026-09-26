"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

const aiToolsMenu = [
  { label: "Writing", href: "/tools?category=Writing" },
  { label: "SEO", href: "/tools?category=SEO" },
  { label: "Marketing", href: "/tools?category=Marketing" },
  { label: "Social Media", href: "/tools?category=Social+Media" },
  { label: "YouTube", href: "/tools?category=YouTube" },
  { label: "Images", href: "/tools?category=Images" },
  { label: "Video", href: "/tools?category=Video" },
  { label: "Coding", href: "/tools?category=Coding" },
];

const solutionsMenu = [
  { label: "Creators", href: "/tools" },
  { label: "Marketers", href: "/tools" },
  { label: "Agencies", href: "/tools" },
  { label: "Small Businesses", href: "/tools" },
  { label: "E-commerce", href: "/tools" },
];

const templatesMenu = [
  { label: "Blog", href: "/templates?category=Blog" },
  { label: "Social", href: "/templates?category=Social+Media" },
  { label: "Ads", href: "/templates?category=Marketing" },
  { label: "Email", href: "/templates?category=Email" },
  { label: "YouTube", href: "/templates?category=YouTube" },
  { label: "Business", href: "/templates?category=Business" },
];

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="focus-ring flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="glass absolute left-0 top-full z-40 mt-1 w-56 rounded-2xl border border-border p-2 shadow-xl"
          >
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="focus-ring block rounded-xl px-3 py-2 text-sm text-foreground/90 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CreateFlow AI</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <NavDropdown label="AI Tools" items={aiToolsMenu} />
          <NavDropdown label="Solutions" items={solutionsMenu} />
          <NavDropdown label="Templates" items={templatesMenu} />
          <Link href="/tools" className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
            Resources
          </Link>
          <Link href="/pricing" className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
            Pricing
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {firebaseUser ? (
            <Link href="/dashboard">
              <Button size="md">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="md">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="md">Start Creating</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="focus-ring rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border bg-surface lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              <Link href="/tools" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                AI Tools
              </Link>
              <Link href="/templates" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                Templates
              </Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                Pricing
              </Link>
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                {firebaseUser ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Go to dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Start Creating</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
