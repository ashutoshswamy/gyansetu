import type { Metadata } from "next";
import SponsorPage from "./sponsor-client";

export const metadata: Metadata = {
  title: "Sponsor a Tour",
  description: "Support Gyan-Setu's educational tours by sponsoring students and volunteers on Jnana Prabodhini's Jnana Pravas programme.",
  alternates: { canonical: "/sponsor" },
};

export default function Page() {
  return <SponsorPage />;
}
