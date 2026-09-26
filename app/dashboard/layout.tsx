"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, loading, firebaseConfigured } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [loading, firebaseUser, router]);

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">Firebase isn&apos;t configured yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Add your Firebase project&apos;s <code>NEXT_PUBLIC_FIREBASE_*</code> environment
          variables to <code>.env.local</code> (see <code>.env.example</code> and the README)
          to enable sign-in and the dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="relative z-50"
            >
              <DashboardSidebar mobile onNavigate={() => setMobileOpen(false)} />
            </motion.div>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-lg bg-surface p-2 text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
