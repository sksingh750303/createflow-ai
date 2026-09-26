"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications, useProjects } from "@/lib/hooks";
import { relativeTime } from "@/lib/utils";
import { tools } from "@/lib/tools";
import { templates } from "@/lib/templates";
import { toast } from "@/lib/toast-store";

export function DashboardTopbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const router = useRouter();
  const { userDoc, signOut } = useAuth();
  const { projects } = useProjects();
  const { notifications, markRead, markAllRead } = useNotifications();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const matchedTools = query
    ? tools.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];
  const matchedTemplates = query
    ? templates.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];
  const matchedProjects = query
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMobileMenu}
        className="focus-ring rounded-lg p-2 text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search tools, templates, projects…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>
        <AnimatePresence>
          {searchOpen && query && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="glass absolute left-0 top-full z-40 mt-1 w-full rounded-2xl border border-border p-2 shadow-xl"
            >
              {matchedTools.length === 0 && matchedTemplates.length === 0 && matchedProjects.length === 0 && (
                <p className="px-3 py-3 text-sm text-muted-foreground">No results found.</p>
              )}
              {matchedTools.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Tools
                  </p>
                  {matchedTools.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tools/${t.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
              {matchedTemplates.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Templates
                  </p>
                  {matchedTemplates.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tools/${t.toolSlug}?template=${t.id}`}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
              {matchedProjects.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Projects
                  </p>
                  {matchedProjects.map((p) => (
                    <Link
                      key={p.id}
                      href="/dashboard/projects"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {userDoc && (
          <span className="hidden rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium sm:block">
            {userDoc.credits.toLocaleString()} credits
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="focus-ring relative rounded-lg p-2 text-foreground hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="glass absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-accent hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="scrollbar-thin max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      You&apos;re all caught up.
                    </p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`block w-full border-b border-border/60 px-4 py-3 text-left text-sm last:border-0 hover:bg-muted ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {relativeTime(n.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-cyan text-sm font-semibold text-white"
          >
            {userDoc?.displayName?.[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="glass absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-border p-2 shadow-xl"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{userDoc?.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userDoc?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    toast("Logged out");
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
