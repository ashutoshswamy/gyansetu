import type { Metadata } from "next";
import { AlumniRegistrationForm } from "@/components/features/alumni-registration-form";

export const metadata: Metadata = {
  title: "Alumni Network",
  description: "Register with the Gyan-Setu alumni network to stay connected with Jnana Prabodhini's Jnana Pravas community of past volunteers and students.",
  alternates: { canonical: "/alumni" },
};

export default function AlumniPage() {
  return <AlumniRegistrationForm />;
}
