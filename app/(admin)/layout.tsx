import { Sidebar } from "@/components/layout/sidebar";
import { RealtimeRefresher } from "@/components/features/realtime-refresher";
import { getUserRole } from "@/lib/clerk/roles";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let role = await getUserRole();
  const db = createServerClient();

  if (!role || !ADMIN_ROLES.includes(role)) {
    // Clerk JWT has no role — check Supabase (manually assigned admin).
    const { data: dbUser } = await db
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .maybeSingle();

    const dbRole = dbUser?.role as UserRole | null;
    if (!dbRole || !ADMIN_ROLES.includes(dbRole)) redirect("/dashboard");

    role = dbRole;

    // Sync to Clerk so future JWT claims carry the role.
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: dbRole },
    });
  } else {
    // Clerk has role — ensure Supabase row exists and role is synced.
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const { error: upsertError } = await db.from("users").upsert(
      {
        clerk_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
        avatar_url: clerkUser.imageUrl,
        role,
      },
      { onConflict: "clerk_id", ignoreDuplicates: false }
    );
    if (upsertError) console.error("[admin layout] user upsert failed:", upsertError.message);
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#FAFAF7" }}>
      <RealtimeRefresher tables={["tours", "tour_applications", "test_attempts", "users", "notifications", "events", "dynamic_forms", "eligibility_tests", "tour_groups"]} />
      <Sidebar role={role as UserRole} />
      <main className="flex-1 overflow-auto min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
