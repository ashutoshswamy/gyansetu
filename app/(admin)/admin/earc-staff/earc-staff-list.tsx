"use client";

import { useState, useTransition } from "react";
import { deleteEarcStaff } from "@/actions/earc";
import { Users, Trash2, Loader2, ShieldCheck } from "lucide-react";

interface StaffMember {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  created_at: string;
}

export function EarcStaffList({ staff }: { staff: StaffMember[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(clerkId: string, name: string) {
    if (!confirm(`Remove "${name}" from EARC staff? Their account will be deleted.`)) return;
    setDeletingId(clerkId);
    startTransition(async () => {
      try {
        await deleteEarcStaff(clerkId);
        window.location.reload();
      } catch {
        alert("Delete failed.");
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #E4DFD1" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Staff Members</h2>
      </div>

      {staff.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
          <p style={{ fontSize: 14, color: "#9B9188" }}>No EARC staff accounts yet.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "#E4DFD1" }}>
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                style={{ background: "rgba(184,56,30,0.08)", color: "#B8381E" }}
              >
                {s.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }}>{s.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, color: "#B8381E", background: "rgba(184,56,30,0.08)" }}>
                    EARC Staff
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#9B9188" }}>{s.email}</p>
              </div>

              <span style={{ fontSize: 11, color: "#9B9188", flexShrink: 0 }}>
                Added {new Date(s.created_at).toLocaleDateString()}
              </span>

              <button
                onClick={() => handleDelete(s.clerk_id, s.name)}
                disabled={isPending && deletingId === s.clerk_id}
                className="w-8 h-8 flex items-center justify-center rounded transition-colors flex-shrink-0"
                style={{ color: "#B8381E" }}
                title="Remove staff"
              >
                {isPending && deletingId === s.clerk_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
