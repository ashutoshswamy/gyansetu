import type { Metadata } from "next";
import TestimonialPage from "./testimonial-client";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "Read what students, volunteers, and alumni say about their experience with Gyan-Setu's educational tours, and share your own story.",
  alternates: { canonical: "/testimonial" },
};

export default function Page() {
  return <TestimonialPage />;
}
