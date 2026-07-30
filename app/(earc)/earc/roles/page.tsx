import { ShieldCheck } from "lucide-react";
import { getEarcCandidates } from "@/actions/users";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { redirect } from "next/navigation";
import { EarcStaffTable } from "./earc-staff-table";

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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            EARC Panel
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Role Management</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Grant or revoke EARC staff access for a user
          </p>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No users yet.</p>
          </div>
        ) : (
          <EarcStaffTable users={users} currentUserId={userId} />
        )}
      </div>
    </div>
  );
}
