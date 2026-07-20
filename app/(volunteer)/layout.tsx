import { Sidebar } from "@/components/layout/sidebar";
import { RealtimeRefresher } from "@/components/features/realtime-refresher";
import { getUserRole } from "@/lib/clerk/roles";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getUserRole();
  if (role !== "volunteer" && role !== "admin" && role !== "super_admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "#FAFAF7" }}>
      <RealtimeRefresher tables={["notifications", "events", "dynamic_forms", "tour_groups", "tour_group_members", "volunteer_assignments", "daily_logs"]} />
      <Sidebar role="volunteer" />
      <main className="flex-1 overflow-auto min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
