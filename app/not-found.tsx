import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Sparkles className="h-10 w-10 text-muted-foreground/50" />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/">
        <Button className="mt-6">Back home</Button>
      </Link>
    </div>
  );
}
