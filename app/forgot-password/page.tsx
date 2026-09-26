"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { toast } from "@/lib/toast-store";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (!firebaseReady) {
      toast("Firebase isn't configured yet — see .env.example.", "error");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
    } catch {
      // Intentionally don't reveal whether the email exists — show the
      // same success state either way, which is standard practice for
      // password-reset flows.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold">CreateFlow AI</span>
        </Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send a real password-reset link via Firebase Authentication.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h2 className="mt-3 text-lg font-semibold">Check your email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If an account exists for {email}, a reset link has been sent.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
