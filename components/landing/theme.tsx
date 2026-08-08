import type { CSSProperties } from "react";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/* Shared "field journal" design tokens — single source of truth for the
   landing page and every (public) marketing page, so they read as one site
   instead of drifting into per-page one-offs. */

export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const pageVars = {
  "--gs-ink": "#14172E",
  "--gs-ink-soft": "#1E2240",
  "--gs-paper": "var(--background)",
  "--gs-paper-deep": "#F1E8D2",
  "--gs-line": "#E1D6B8",
  "--gs-line-ink": "rgba(251,247,236,.14)",
  "--gs-marigold": "#E8A33D",
  "--gs-rust": "#B8492E",
  "--gs-text": "#1C1A14",
  "--gs-text-soft": "#5C5646",
  "--gs-text-mute": "#948C77",
} as CSSProperties;

export const F_DISPLAY = "var(--font-fraunces), serif";
export const F_BODY = "var(--font-plex-sans), sans-serif";
export const F_MONO = "var(--font-plex-mono), monospace";

export const fontVars = `${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`;

/* ── Reusable button styles (ink sections vs. paper sections) ── */
export const btnMarigold: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--gs-marigold)", color: "var(--gs-ink)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.02em",
  padding: "13px 28px", borderRadius: 3, textDecoration: "none", border: "none", cursor: "pointer",
};
export const btnOutlinePaper: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "transparent", color: "var(--gs-paper)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 600,
  padding: "12px 27px", borderRadius: 3, textDecoration: "none",
  border: "1.5px solid rgba(251,247,236,.3)", cursor: "pointer",
};
export const btnInk: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--gs-ink)", color: "var(--gs-paper)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 700,
  padding: "12px 26px", borderRadius: 3, textDecoration: "none", border: "none", cursor: "pointer",
};

/* ── Eyebrow label — a field-log coordinate/reference line ── */
export function Eyebrow({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "paper" }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        fontFamily: F_MONO, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--gs-marigold)", marginBottom: 14,
      }}
    >
      <span style={{ display: "inline-block", width: 22, height: 1.5, background: "var(--gs-marigold)" }} />
      {children}
    </span>
  );
}
