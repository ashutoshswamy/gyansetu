"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExpenseAdvance } from "@/actions/finance";
import { getAllGroups } from "@/actions/groups";

export function AdvanceForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getAllGroups().then(data => setGroups(data as unknown as typeof groups)).catch(() => setGroups([]));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createExpenseAdvance({
        group_id: fd.get("group_id") as string,
        amount: Number(fd.get("amount")),
        notes: (fd.get("notes") as string) || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      toast.success("Advance recorded successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record advance";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      {error && (
        <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--gs-danger)" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Group <span style={{ color: "var(--gs-danger)" }}>*</span></label>
          <select name="group_id" required style={inputStyle}>
            <option value="">Select group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "var(--gs-danger)" }}>*</span></label>
          <input name="amount" type="number" min="0" step="0.01" required placeholder="Enter amount" style={inputStyle} />
        </div>
        <button type="submit" disabled={saving} style={{ background: "var(--gs-accent)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, height: 37 }}>
          {saving ? "Saving..." : "Record Advance"}
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Notes</label>
        <input name="notes" type="text" placeholder="Enter notes" style={inputStyle} />
      </div>
    </form>
  );
}
