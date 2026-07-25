import { getEarcCandidates } from "@/actions/users";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { EarcRoleToggle } from "./earc-role-toggle";

export default async function EarcStaffPage() {
  let userId: string;
  let users: Awaited<ReturnType<typeof getEarcCandidates>>;
  try {
    ({ userId } = await requireAdminUser());
    users = await getEarcCandidates();
  } catch (err) {
    console.error("[earc-staff page]", err);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>EARC Staff</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Grant or remove EARC staff access &middot; {users.length} total
          </p>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No users yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3F0E8", borderBottom: "1px solid #E4DFD1" }}>
                    <th className="p-4 font-semibold text-[#5A5247]">Name</th>
                    <th className="p-4 font-semibold text-[#5A5247]">Role</th>
                    <th className="p-4 font-semibold text-[#5A5247]"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #E4DFD1" }} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-medium text-[#19140F]">{u.name}</div>
                        <div className="text-xs text-[#9B9188]">{u.email}</div>
                      </td>
                      <td className="p-4 text-[#5A5247] capitalize">{u.role}</td>
                      <td className="p-4">
                        {u.clerk_id === userId ? (
                          <span style={{ fontSize: 12, color: "#9B9188" }}>Cannot change own role</span>
                        ) : (
                          <EarcRoleToggle clerkId={u.clerk_id} isEarcStaff={u.role === "earc_staff"} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
