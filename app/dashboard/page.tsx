"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Image as ImageIcon, Megaphone, PenLine, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useHistory, useProjects } from "@/lib/hooks";
import { Card } from "@/components/ui/primitives";
import { relativeTime, wordCount } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";

const usageData = [
  { day: "Mon", generations: 4 },
  { day: "Tue", generations: 7 },
  { day: "Wed", generations: 5 },
  { day: "Thu", generations: 9 },
  { day: "Fri", generations: 6 },
  { day: "Sat", generations: 3 },
  { day: "Sun", generations: 8 },
];

const quickActions = [
  { label: "Write", href: "/dashboard/writer", icon: PenLine },
  { label: "Create Image", href: "/dashboard/image", icon: ImageIcon },
  { label: "Create Video", href: "/dashboard/video", icon: Zap },
  { label: "Social Post", href: "/dashboard/social", icon: Megaphone },
  { label: "SEO Article", href: "/dashboard/seo", icon: TrendingUp },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const { userDoc } = useAuth();
  const { projects } = useProjects();
  const { history } = useHistory();

  const totalWords = history.reduce((acc, h) => acc + wordCount(h.content), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting()}, {userDoc?.displayName?.split(" ")[0] ?? "Creator"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Credits remaining", value: userDoc?.credits?.toLocaleString() ?? "0" },
          { label: "Projects", value: projects.length },
          { label: "Generations", value: history.length },
          { label: "Words generated", value: totalWords.toLocaleString() },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="focus-ring flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weekly usage</h2>
            <Badge variant="accent">
              <Sparkles className="mr-1 h-3 w-3" /> This week
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(258 90% 68%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(258 90% 68%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generations"
                  stroke="hsl(258 90% 68%)"
                  fill="url(#usageGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Illustrative weekly pattern — wire this to a `usage` Firestore aggregate for exact per-day counts.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Recent projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href="/dashboard/projects"
                className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(p.updatedAt)}</p>
                </div>
                <Badge variant={p.status === "completed" ? "success" : "default"}>
                  {p.status}
                </Badge>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No projects yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent generations</h2>
          <Link href="/dashboard/history" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-1">
          {history.slice(0, 5).map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-muted">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.type} · {relativeTime(h.createdAt)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{h.creditsUsed} credits</span>
            </div>
          ))}
          {history.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No generation history yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
