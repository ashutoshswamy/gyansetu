"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitExpense } from "@/actions/finance";
import { createClientClient } from "@/lib/supabase/client";
import type { ExpenseInput } from "@/lib/validations";

const CATEGORIES: ExpenseInput["category"][] = ["travel", "accommodation", "food", "materials", "miscellaneous", "other"];

export function ExpenseForm({ groupId }: { groupId: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (groupId) return;
    createClientClient()
      .from("tour_groups")
      .select("id, name, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups((data as unknown as typeof groups) ?? []));
  }, [groupId]);

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
      await submitExpense({
        group_id: groupId || (fd.get("group_id") as string),
        category: fd.get("category") as ExpenseInput["category"],
        amount: Number(fd.get("amount")),
        bill_url: (fd.get("bill_url") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 14px" }}>Submit Expense</h2>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="space-y-3">
        {!groupId && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group <span style={{ color: "#DC2626" }}>*</span></label>
            <select name="group_id" required style={inputStyle}>
              <option value="">Select group...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Category <span style={{ color: "#DC2626" }}>*</span></label>
            <select name="category" required style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "#DC2626" }}>*</span></label>
            <input name="amount" type="number" min="0" step="0.01" required style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Bill URL</label>
          <input name="bill_url" type="text" placeholder="https://..." style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Description</label>
          <textarea name="description" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      <button type="submit" disabled={saving} style={{ marginTop: 14, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Submitting..." : "Submit Expense"}
      </button>
    </form>
  );
}
