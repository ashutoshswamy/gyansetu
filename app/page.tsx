import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function HomePage() {
  const { userId } = await auth();

  const db = createServerClient();
  const { data: testimonials } = await db
    .from("testimonials")
    .select("id, name, batch_year, role, message")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return <LandingPage isLoggedIn={!!userId} testimonials={testimonials ?? []} />;
}
