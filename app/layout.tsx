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

export const metadata: Metadata = {
  title: "Gyan Setu | Jnana Prabodhini Educational Tours",
  description: "Portal for Jnana Prabodhini's Jnana Pravas programme: educational tours across India for students to meet government officials, explore regional cultures, and build connections.",
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
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors position="top-center" closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
