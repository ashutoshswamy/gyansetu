import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { RealtimeRefresher } from "@/components/features/realtime-refresher";
import { getUserRole } from "@/lib/clerk/roles";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

const VOLUNTEER_ALLOWED: UserRole[] = ["volunteer", "admin", "super_admin"];

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let role = await getUserRole();

  if (!role || !VOLUNTEER_ALLOWED.includes(role)) {
    const db = createServerClient();
    const { data: dbUser } = await db.from("users").select("role").eq("clerk_id", userId).maybeSingle();
    const dbRole = dbUser?.role as UserRole | null;
    if (!dbRole || !VOLUNTEER_ALLOWED.includes(dbRole)) redirect("/dashboard");

    role = dbRole;
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, { publicMetadata: { role: dbRole } });
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <RealtimeRefresher tables={["notifications", "events", "dynamic_forms", "tour_groups", "tour_group_members", "volunteer_assignments", "daily_logs"]} />
      <Sidebar role="volunteer" />
      <main className="flex-1 overflow-auto min-w-0 pt-14 lg:pt-0 flex flex-col">
        <TopBar role="volunteer" />
        {children}
      </main>
    </div>
  );
}
