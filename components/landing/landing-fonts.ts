import { Barlow_Condensed, Hind, Doto } from "next/font/google";

// Signage caps, bilingual body (Latin + Devanagari), dot-matrix ticket print.
const sign = Barlow_Condensed({
  variable: "--gl-sign",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Hind({
  variable: "--gl-body",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dot = Doto({
  variable: "--gl-dot",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
});

export const landingFontVars = `${sign.variable} ${body.variable} ${dot.variable}`;
