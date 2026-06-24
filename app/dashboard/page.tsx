import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/clerk/roles";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardRedirect() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getUserRole();

  if (role === "admin" || role === "super_admin") redirect("/admin");
  if (role === "volunteer") redirect("/volunteer");

  // No role in session claims check Supabase for ground truth
  const db = createServerClient();
  const { data: dbUser } = await db
    .from("users")
    .select("role")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (dbUser?.role === "admin" || dbUser?.role === "super_admin") redirect("/admin");
  if (dbUser?.role === "volunteer") redirect("/volunteer");

  // No role or null role → student area (take tests, apply for tours)
  redirect("/student");
}
