"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EarcRoleToggle } from "./earc-role-toggle";

interface EarcCandidate {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  role: string;
}

export function EarcStaffTable({ users, currentUserId }: { users: EarcCandidate[]; currentUserId: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9B9188" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          style={{
            width: "100%", padding: "9px 12px 9px 34px", fontSize: 13,
            border: "1.5px solid #E4DFD1", borderRadius: 8, outline: "none",
            background: "white", color: "#19140F", boxSizing: "border-box",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
          <p style={{ fontSize: 14, color: "#9B9188" }}>No users match &ldquo;{query}&rdquo;.</p>
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
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #E4DFD1" }} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-medium text-[#19140F]">{u.name}</div>
                      <div className="text-xs text-[#9B9188]">{u.email}</div>
                    </td>
                    <td className="p-4 text-[#5A5247] capitalize">{u.role}</td>
                    <td className="p-4">
                      {u.clerk_id === currentUserId ? (
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
    </>
  );
}
