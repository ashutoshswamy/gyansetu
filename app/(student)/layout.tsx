import { Sidebar } from "@/components/layout/sidebar";
import { RealtimeRefresher } from "@/components/features/realtime-refresher";
import { getUserRole, isEnrolleeRole } from "@/lib/clerk/roles";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getUserRole();
  if (!isEnrolleeRole(role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "#FAFAF7" }}>
      <RealtimeRefresher tables={["tour_applications", "test_attempts", "notifications", "dynamic_forms", "eligibility_tests", "tours"]} />
      <Sidebar role={role ?? "enrollee"} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
