import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { EazoProvider } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { BottomTabBar, SidebarNav } from "@/components/nav/AppNav";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heading",
  display: "swap",
});

// Public origin used to resolve relative URLs in OG / Twitter Card tags
// and `canonical`. Picks up Vercel's auto-injected hostname; on other
// hosts (or when using a custom domain whose OG should not show the
// `*.vercel.app` URL), point `metadataBase` at the canonical URL
// directly instead of relying on this.
const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const SITE_TITLE = "育见";
const SITE_DESCRIPTION = "温柔且科学的儿童成长记录与非焦虑AI顾问，在您第一次为人父母的马拉松中，予您不评判、不拆解、恒温守护的安心与依靠。";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "https://eazo.ai/favicon.ico",
  },
  // Social preview cards (Open Graph + Twitter). Most platforms (X,
  // Facebook, LinkedIn, Slack, Discord, WeChat, iMessage) read these
  // tags directly. For the preview image, drop a 1200×630 PNG/JPG at
  // `src/app/opengraph-image.png` — Next.js auto-detects file-based
  // metadata and overrides `openGraph.images` below at build time.
  openGraph: {
    type: "website",
    siteName: "Eazo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("h-full antialiased", notoSans.variable, notoSerif.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-svh flex flex-col bg-[var(--color-accent)]">
        <EazoProvider>
          <UserSyncEffect />
          <div className="flex min-h-svh">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-[#FDFAF4] border-r border-[var(--color-border)]">
              <SidebarNav />
            </aside>
            {/* Main content */}
            <main className="flex-1 md:ml-60 pb-16 md:pb-0 flex flex-col min-h-0">
              <div className="w-full max-w-[640px] mx-auto flex flex-col flex-1 min-h-0">
                {children}
              </div>
            </main>
            {/* Mobile bottom tab bar */}
            <BottomTabBar />
          </div>
          <Toaster />
        </EazoProvider>
      </body>
    </html>
  );
}
