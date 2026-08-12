import type { Metadata } from "next";
import InstitutionPage from "./institution-client";

export const metadata: Metadata = {
  title: "Partner with Gyan-Setu",
  description: "Register your school, college, or institution as a partner for Gyan-Setu's student exchange tours and educational workshop programme.",
  alternates: { canonical: "/institution" },
};

export default function Page() {
  return <InstitutionPage />;
}
