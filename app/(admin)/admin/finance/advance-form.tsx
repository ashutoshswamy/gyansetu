"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExpenseAdvance } from "@/actions/finance";
import { createClientClient } from "@/lib/supabase/client";

export function AdvanceForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    createClientClient()
      .from("tour_groups")
      .select("id, name, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups((data as unknown as typeof groups) ?? []));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createExpenseAdvance({
        group_id: fd.get("group_id") as string,
        amount: Number(fd.get("amount")),
        notes: (fd.get("notes") as string) || undefined,
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record advance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group <span style={{ color: "#DC2626" }}>*</span></label>
          <select name="group_id" required style={inputStyle}>
            <option value="">Select group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "#DC2626" }}>*</span></label>
          <input name="amount" type="number" min="0" step="0.01" required style={inputStyle} />
        </div>
        <button type="submit" disabled={saving} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, height: 37 }}>
          {saving ? "Saving..." : "Record Advance"}
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Notes</label>
        <input name="notes" type="text" style={inputStyle} />
      </div>
    </form>
  );
}
