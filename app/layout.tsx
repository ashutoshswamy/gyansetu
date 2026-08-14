import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/layout/query-provider";
import "./globals.css";

// Same body font as the landing page (components/landing/theme.tsx), so app-wide
// typography reads as one site instead of dashboard Poppins vs. marketing Plex Sans.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gyansetu.earc.jnanaprabodhini.org";
const siteTitle = "Gyan Setu | Jnana Prabodhini";
const siteDescription = "Gyan-Setu is a year-long volunteer initiative by Jnana Prabodhini's Educational Activity Research Centre (EARC). Volunteers conduct joyful, hands-on science and mathematics workshops, along with career guidance sessions and the \"Know Our Country\" Exhibition, in remote, tribal, and aspirational regions across India. The programme fosters scientific curiosity, knowledge exchange, cultural understanding, and national integration.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s | Gyan Setu" },
  description: siteDescription,
  keywords: ["Gyan Setu", "Jnana Prabodhini", "EARC", "Educational Activity Research Centre", "science workshops", "career guidance", "Know Our Country Exhibition", "volunteer programme", "tribal education India", "national integration"],
  applicationName: "Gyan Setu",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Gyan Setu",
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Gyan Setu" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
      <html
        lang="en"
        className={`${plexSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-background text-foreground">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                name: "Gyan Setu — Jnana Prabodhini",
                alternateName: "Jnana Pravas",
                url: siteUrl,
                logo: `${siteUrl}/logo_wide.png`,
                description: siteDescription,
              }),
            }}
          />
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors position="top-center" closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
