"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertKitAssignment } from "@/actions/kits";
import { createClientClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

export function NewAssignmentForm({ assignedGroupIds }: { assignedGroupIds: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; tours?: { title: string }[] | null }[]>([]);

  useEffect(() => {
    createClientClient()
      .from("tour_groups")
      .select("id, name, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups(data ?? []));
  }, []);

  const availableGroups = groups.filter(g => !assignedGroupIds.includes(g.id));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await upsertKitAssignment({
        group_id: fd.get("group_id") as string,
        school_count: Number(fd.get("school_count")) || 1,
        packed: false,
        distributed: false,
      });
      (e.target as HTMLFormElement).reset();
      toast.success("Kit assigned successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create assignment";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (availableGroups.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>Group *</label>
          <select name="group_id" required style={inputStyle}>
            <option value="">Select group...</option>
            {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}{g.tours?.[0]?.title ? ` — ${g.tours[0].title}` : ""}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>School Count *</label>
          <input name="school_count" type="number" min={1} defaultValue={1} required placeholder="Enter number of schools" style={inputStyle} />
        </div>
      </div>
      <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 12 }}>
        {loading ? "Saving..." : "+ Assign Kit"}
      </button>
    </form>
  );
}
