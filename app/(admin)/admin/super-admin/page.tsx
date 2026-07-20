import { getAllUsers } from "@/actions/users";
import { requireSuperAdminUser } from "@/lib/clerk/action-auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { RoleSelect } from "./role-select";
import type { UserRole } from "@/types";

const ROLE_GROUPS: { key: UserRole; label: string }[] = [
  { key: "super_admin", label: "Super Admin" },
  { key: "admin", label: "Admin" },
  { key: "earc_staff", label: "EARC Staff" },
];

export default async function SuperAdminPage() {
  let userId: string;
  let users: Awaited<ReturnType<typeof getAllUsers>>;
  try {
    ({ userId } = await requireSuperAdminUser());
    users = await getAllUsers();
  } catch (err) {
    console.error("[super-admin page]", err);
    redirect("/dashboard");
  }

  const grouped = ROLE_GROUPS.map((g) => ({
    ...g,
    users: users.filter((u) => u.role === g.key),
  }));
  const shownCount = grouped.reduce((sum, g) => sum + g.users.length, 0);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Super Admin
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Role Assignment</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Assign admin &amp; EARC staff roles &middot; {shownCount} total
          </p>
        </div>

        {shownCount === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No users yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <div key={g.key}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#5A5247", marginBottom: 8 }}>
                  {g.label} <span style={{ color: "#9B9188", fontWeight: 500 }}>({g.users.length})</span>
                </h2>

                {g.users.length === 0 ? (
                  <div className="rounded-xl py-6 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
                    <p style={{ fontSize: 13, color: "#9B9188" }}>No users in this role.</p>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#F3F0E8", borderBottom: "1px solid #E4DFD1" }}>
                            <th className="p-4 font-semibold text-[#5A5247]">Name</th>
                            <th className="p-4 font-semibold text-[#5A5247]">Assign Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: "1px solid #E4DFD1" }} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <div className="font-medium text-[#19140F]">{u.name}</div>
                                <div className="text-xs text-[#9B9188]">{u.email}</div>
                              </td>
                              <td className="p-4">
                                {u.clerk_id === userId ? (
                                  <span style={{ fontSize: 12, color: "#9B9188" }}>Cannot change own role</span>
                                ) : u.role === "super_admin" ? (
                                  <span style={{ fontSize: 12, color: "#9B9188" }}>Assigned via Clerk only</span>
                                ) : (
                                  <RoleSelect clerkId={u.clerk_id} role={u.role} />
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
