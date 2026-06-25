import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/clerk/action-auth";

export default async function DashboardRedirect() {
  // resolveUserWithRole handles backfill + Clerk↔Supabase sync
  const { user } = await getAuthenticatedUser();
  const role = user.role;

  if (role === "admin") redirect("/admin");
  if (role === "volunteer") redirect("/volunteer");
  if (role === "earc_staff") redirect("/earc");

  // null role → enrollee area
  redirect("/student");
}
