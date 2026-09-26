import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppHydrator } from "@/components/providers/app-hydrator";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/command-palette";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://createflow.ai"),
  title: {
    
    default: "CreateFlow AI — Create. Automate. Grow. With AI.",
    template: "%s · CreateFlow AI",

    
  },
  description:
    "CreateFlow AI is the all-in-one AI workspace for writing, images, video, social and SEO — write, design, optimize and publish from one place.",
  openGraph: {
    title: "CreateFlow AI — Create. Automate. Grow. With AI.",
    description:
      "One AI workspace for writing, images, video, social and SEO content.",
    siteName: "CreateFlow AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreateFlow AI",
    description:
      "One AI workspace for writing, images, video, social and SEO content.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AppHydrator />
          <AuthProvider>
            {children}
            <Toaster />
            <CommandPalette />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
