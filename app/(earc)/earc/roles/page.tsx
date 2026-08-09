import { ShieldCheck } from "lucide-react";
import { getEarcCandidates } from "@/actions/users";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { redirect } from "next/navigation";
import { EarcStaffTable } from "./earc-staff-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function EarcRolesPage() {
  let userId: string;
  let users: Awaited<ReturnType<typeof getEarcCandidates>>;
  try {
    ({ userId } = await requireAdminUser());
    users = await getEarcCandidates();
  } catch (err) {
    console.error("[earc roles page]", err);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            EARC Panel
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Role Management</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Grant or revoke EARC staff access for a user
          </p>
        </div>

        {users.length === 0 ? (
          <Card>
<CardContent>
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>No users yet.</p>
          </CardContent>
</Card>
        ) : (
          <EarcStaffTable users={users} currentUserId={userId} />
        )}
      </div>
    </div>
  );
}
