import type { Metadata } from "next";
import FAQPage from "./faq-client";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Gyan-Setu, Jnana Prabodhini's student volunteer programme conducting educational tours and workshops across India.",
  alternates: { canonical: "/faq" },
};

export default function Page() {
  return <FAQPage />;
}
