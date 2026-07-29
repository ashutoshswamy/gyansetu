import { createServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export const revalidate = 60;

export default async function HomePage() {
  const db = createServerClient();
  const { data: testimonials } = await db
    .from("testimonials")
    .select("id, name, batch_year, role, message")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(6);

  return <LandingPage testimonials={testimonials ?? []} />;
}
