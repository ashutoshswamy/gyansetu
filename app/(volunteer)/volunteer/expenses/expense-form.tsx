"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitExpense } from "@/actions/finance";
import { getGroupsForSelect } from "@/actions/groups";
import type { ExpenseInput } from "@/lib/validations";

const CATEGORIES: { value: ExpenseInput["category"]; label: string; hint: string }[] = [
  { value: "travel", label: "Travel & Transportation", hint: "Train, Bus, Flight, Taxi, Auto, Local Transport, Fuel" },
  { value: "accommodation", label: "Accommodation", hint: "Hotel, Hostel, Guest House, Homestay" },
  { value: "food", label: "Food & Refreshments", hint: "Breakfast, Lunch, Dinner, Snacks" },
  { value: "materials", label: "Program Materials & Printing", hint: "Stationery, science materials, printing, teaching aids, banners, etc." },
  { value: "miscellaneous", label: "Miscellaneous", hint: "Any expense not covered under the above categories" },
];

const SUBCATEGORY_OPTIONS: Partial<Record<ExpenseInput["category"], readonly string[]>> = {
  travel: ["Train", "Bus", "Flight", "Taxi", "Auto", "Local Transport", "Fuel"],
  accommodation: ["Hotel", "Hostel", "Guest House", "Homestay"],
  food: ["Breakfast", "Lunch", "Dinner", "Snacks"],
};

const VOLUNTEER_COUNT_CATEGORIES: ExpenseInput["category"][] = ["accommodation", "food"];

export function ExpenseForm({ groupId }: { groupId: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [category, setCategory] = useState<ExpenseInput["category"]>("travel");

  useEffect(() => {
    if (groupId) return;
    getGroupsForSelect().then(data => setGroups(data as unknown as typeof groups)).catch(() => setGroups([]));
  }, [groupId]);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  const subOptions = SUBCATEGORY_OPTIONS[category];
  const needsVolunteerCount = VOLUNTEER_COUNT_CATEGORIES.includes(category);
  const currentCategory = CATEGORIES.find(c => c.value === category)!;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await submitExpense({
        group_id: groupId || (fd.get("group_id") as string),
        category,
        subcategory: (fd.get("subcategory") as string) || undefined,
        volunteer_count: needsVolunteerCount ? Number(fd.get("volunteer_count")) : undefined,
        vendor_name: (fd.get("vendor_name") as string) || undefined,
        expense_date: fd.get("expense_date") as string,
        amount: Number(fd.get("amount")),
        bill_url: (fd.get("bill_url") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      setCategory("travel");
      toast.success("Expense submitted successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit expense";
      setError(message);
      toast.error(message);
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

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Category <span style={{ color: "#DC2626" }}>*</span></label>
          <select name="category" required value={category} onChange={e => setCategory(e.target.value as ExpenseInput["category"])} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>{currentCategory.hint}</p>
        </div>

        {subOptions ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Type <span style={{ color: "#DC2626" }}>*</span></label>
            <select name="subcategory" required defaultValue="" style={inputStyle}>
              <option value="" disabled>Select type...</option>
              {subOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
              {category === "materials" ? "Items Purchased" : "Purpose of Expense"} <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              name="subcategory"
              type="text"
              required
              placeholder={category === "materials" ? "e.g. stationery, science materials, printing, teaching aids, banners..." : "Describe the purpose of this expense..."}
              style={inputStyle}
            />
          </div>
        )}

        {needsVolunteerCount && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Number of Volunteers <span style={{ color: "#DC2626" }}>*</span></label>
            <input name="volunteer_count" type="number" min="1" step="1" required placeholder="How many volunteers?" style={inputStyle} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "#DC2626" }}>*</span></label>
            <input name="amount" type="number" min="0" step="0.01" required placeholder="Enter amount" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Date <span style={{ color: "#DC2626" }}>*</span></label>
            <input name="expense_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Name of Person / Vendor</label>
          <input name="vendor_name" type="text" placeholder="Who was paid?" style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Bill URL</label>
          <input name="bill_url" type="text" placeholder="https://..." style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Additional Notes</label>
          <textarea name="description" rows={2} placeholder="Anything else to add..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      <button type="submit" disabled={saving} style={{ marginTop: 14, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Submitting..." : "Submit Expense"}
      </button>
    </form>
  );
}
