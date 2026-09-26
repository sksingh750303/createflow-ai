"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { toast } from "@/lib/toast-store";

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts — please wait and try again.";
  if (code.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  return "Something went wrong signing in. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast("Enter your email and password.", "error");
      return;
    }
    if (!firebaseReady) {
      toast("Firebase isn't configured yet — see .env.example.", "error");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast("Welcome back!", "success");
      router.push("/dashboard");
    } catch (err) {
      toast(friendlyAuthError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!firebaseReady) {
      toast("Firebase isn't configured yet — see .env.example.", "error");
      return;
    }
    try {
      await signInWithGoogle();
      toast("Signed in with Google", "success");
      router.push("/dashboard");
    } catch (err) {
      toast(friendlyAuthError(err), "error");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="animated-gradient-bg relative hidden flex-col justify-between p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold">CreateFlow AI</span>
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            One AI workspace to write, design and publish — everything, in one place.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-foreground/70">
            Join creators and teams already saving hours every week with CreateFlow AI.
          </p>
        </div>
        <p className="text-xs text-foreground/50">© 2026 CreateFlow AI</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-cyan text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold">CreateFlow AI</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to continue creating.
          </p>

          {!firebaseReady && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Firebase isn&apos;t configured yet — sign-in will not work until
              the <code>NEXT_PUBLIC_FIREBASE_*</code> env vars are set (see .env.example).
            </p>
          )}

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
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" size="lg" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
