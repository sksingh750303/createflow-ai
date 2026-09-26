"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Cog,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  Palette,
  PenLine,
  Plug,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Writer", href: "/dashboard/writer", icon: PenLine },
  { label: "Image", href: "/dashboard/image", icon: ImageIcon },
  { label: "Video", href: "/dashboard/video", icon: Video },
  { label: "Social Media", href: "/dashboard/social", icon: Megaphone },
  { label: "SEO", href: "/dashboard/seo", icon: TrendingUp },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Projects", href: "/dashboard/projects", icon: Boxes },
  { label: "History", href: "/dashboard/history", icon: Clock },
  { label: "Brand Kit", href: "/dashboard/brand-kit", icon: Palette },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Cog },
];

export function DashboardSidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { userDoc } = useAuth();

  const isCollapsed = collapsed && !mobile;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200",
        isCollapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        {!isCollapsed && (
          <span className="truncate text-base font-semibold tracking-tight">CreateFlow AI</span>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        {!isCollapsed && userDoc && (
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-semibold">{userDoc.credits.toLocaleString()}</span>
            </div>
            <Link
              href="/dashboard/billing"
              className="mt-2 block rounded-lg bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>
        )}
        {!mobile && (
          <button
            onClick={toggleSidebar}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!isCollapsed && "Collapse"}
          </button>
        )}
      </div>
    </aside>
  );
}
