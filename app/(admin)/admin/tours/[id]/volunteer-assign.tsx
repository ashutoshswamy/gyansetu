"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { assignVolunteerToTour, removeVolunteerFromTour } from "@/actions/tours";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Trash2 } from "lucide-react";

type Volunteer = { id: string; name: string; email: string };
type Assignment = { id: string; role_description?: string; users?: { id: string; name: string; email: string } };

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F",
};

export function VolunteerAssign({ tourId, assignments }: { tourId: string; assignments: Assignment[] }) {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  async function handleAdd() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await assignVolunteerToTour(tourId, userId, role || undefined);
      setUserId("");
      setRole("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign volunteer");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(volunteerId: string) {
    setSaving(true);
    try {
      await removeVolunteerFromTour(tourId, volunteerId);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: "white", border: "1px solid #E4DFD1" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 12 }}>
        Volunteers ({assignments.length})
      </p>

      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div style={{ flex: 2 }}>
          <VolunteerCombobox
            volunteers={volunteers}
            value={userId}
            onChange={setUserId}
            excludeIds={new Set(assignments.map(a => a.users?.id).filter((id): id is string => !!id))}
          />
        </div>
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Role (optional)"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !userId}
          style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: saving || !userId ? "not-allowed" : "pointer", opacity: saving || !userId ? 0.6 : 1, flexShrink: 0 }}
        >
          Add
        </button>
      </div>

      {assignments.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9B9188" }}>No volunteers assigned yet.</p>
      ) : (
        <div className="space-y-1.5">
          {assignments.map(a => (
            <div key={a.id} className="flex items-center justify-between" style={{ background: "#F3F0E8", borderRadius: 8, padding: "8px 12px" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }}>{a.users?.name}</span>
                <span style={{ fontSize: 12, color: "#9B9188", marginLeft: 8 }}>{a.users?.email}</span>
                {a.role_description && <span style={{ fontSize: 12, color: "#4A55BE", marginLeft: 8, padding: "1px 6px", background: "rgba(74,85,190,0.08)", borderRadius: 4 }}>{a.role_description}</span>}
              </div>
              <button
                onClick={() => a.users?.id && handleRemove(a.users.id)}
                disabled={saving}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
