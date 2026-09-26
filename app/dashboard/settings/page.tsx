"use client";

import { useEffect, useState } from "react";
import { Bell, Lock, Palette, Shield, User } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { useAuth } from "@/components/providers/auth-provider";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { useTheme } from "@/components/providers/theme-provider";
import { toast } from "@/lib/toast-store";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const { firebaseUser, userDoc } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    updates: false,
    completion: true,
  });
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (userDoc?.displayName) setName(userDoc.displayName);
    if (userDoc?.preferences) {
      setNotifPrefs({
        email: userDoc.preferences.emailNotifications ?? true,
        updates: userDoc.preferences.productUpdates ?? false,
        completion: userDoc.preferences.generationCompletionAlerts ?? true,
      });
    }
  }, [userDoc]);

  async function handleSaveProfile() {
    if (!firebaseUser) return;
    await updateUserProfile(firebaseUser.uid, { displayName: name });
    toast("Settings updated", "success");
  }

  async function handleSaveNotifications() {
    if (!firebaseUser) return;
    await updateUserProfile(firebaseUser.uid, {
      preferences: {
        emailNotifications: notifPrefs.email,
        productUpdates: notifPrefs.updates,
        generationCompletionAlerts: notifPrefs.completion,
      },
    });
    toast("Settings updated", "success");
  }

  async function handleSendReset() {
    if (!userDoc?.email) return;
    await sendPasswordReset(userDoc.email);
    setResetSent(true);
    toast("Password reset email sent", "success");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Card className="h-fit p-3">
        <div className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                tab === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        {tab === "profile" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-cyan text-lg font-semibold text-white">
                {name?.[0]?.toUpperCase() ?? "C"}
              </span>
              <Button variant="secondary" size="sm" onClick={() => toast("Avatar upload coming soon")}>
                Change avatar
              </Button>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userDoc?.email ?? ""} disabled />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Managed by Firebase Authentication — email changes require re-verification.
              </p>
            </div>
            <Button onClick={handleSaveProfile}>Save changes</Button>
          </div>
        )}

        {tab === "account" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="mt-1 text-lg font-semibold capitalize">{userDoc?.plan ?? "free"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm text-muted-foreground">Credits remaining</p>
              <p className="mt-1 text-lg font-semibold">{userDoc?.credits?.toLocaleString() ?? 0}</p>
            </div>
          </div>
        )}

        {tab === "appearance" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    theme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {[
              { key: "email" as const, label: "Email notifications" },
              { key: "updates" as const, label: "Product updates" },
              { key: "completion" as const, label: "Generation completion alerts" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm">{item.label}</span>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={(e) =>
                    setNotifPrefs((p) => ({ ...p, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </label>
            ))}
            <Button onClick={handleSaveNotifications}>Save preferences</Button>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Security</h2>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-medium">Password</p>
              <p className="mt-1 text-xs text-muted-foreground">
                For security, password changes go through a verified reset email rather than
                typing a new one here.
              </p>
              <Button size="sm" className="mt-3" onClick={handleSendReset} disabled={resetSent}>
                {resetSent ? "Reset email sent" : "Send password reset email"}
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-medium">Active sessions</p>
              <p className="mt-1 text-xs text-muted-foreground">This device · current session</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
