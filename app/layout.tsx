import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { BRAND } from "@/lib/brand";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { IOSInstallPrompt } from "@/components/layout/IOSInstallPrompt";
import { HideOnAgentPages } from "@/components/layout/HideOnAgentPages";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: { siteName: BRAND.name, locale: "en_IN", type: "website" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${notoTamil.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={BRAND.themeColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col text-[#0C2B29] bg-[#F8F6F0]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-navy-900 focus:px-4 focus:py-2 focus:rounded-btn focus:shadow-lg">
          Skip to content
        </a>
        <AuthProvider>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <HideOnAgentPages alsoApp>
            <Footer />
          </HideOnAgentPages>
          <MobileBottomNav />
          <IOSInstallPrompt />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
