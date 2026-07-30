import { Sidebar } from "@/components/layout/sidebar";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/clerk/roles";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

const CORE_MEMBER_ALLOWED: UserRole[] = ["group_core_member", "admin", "super_admin"];

export default async function CoreMemberLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let role = await getUserRole();
  const db = createServerClient();

  if (!role || !CORE_MEMBER_ALLOWED.includes(role)) {
    const { data: dbUser } = await db
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .maybeSingle();

    const dbRole = dbUser?.role as UserRole | null;
    if (!dbRole || !CORE_MEMBER_ALLOWED.includes(dbRole)) redirect("/sign-in");

    role = dbRole;

    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: dbRole },
    });
  } else {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    await db.from("users").upsert(
      {
        clerk_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
        avatar_url: clerkUser.imageUrl,
        role,
      },
      { onConflict: "clerk_id", ignoreDuplicates: false }
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#FBF7EC" }}>
      <Sidebar role={role as UserRole} />
      <main className="flex-1 overflow-auto min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
