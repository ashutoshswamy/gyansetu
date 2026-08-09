"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitExpense, resubmitExpense } from "@/actions/finance";
import { getGroupsForSelect } from "@/actions/groups";
import { uploadFileToStorage } from "@/actions/upload";
import type { ExpenseInput } from "@/lib/validations";
import type { Expense } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

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

// Upload-only receipt field — no raw URL entry, so volunteers can't paste an arbitrary
// (possibly dead or unrelated) link in place of an actual bill.
function ReceiptUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const url = await uploadFileToStorage(fd, "media", "receipts");
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const fileName = value ? decodeURIComponent(value.split("/").pop() ?? "Receipt") : "";

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Receipt</label>
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 6, background: "var(--background)" }}>
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--gs-accent)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName}
          </a>
          <button type="button" onClick={() => onChange("")} style={{ fontSize: 12, color: "var(--gs-danger)", background: "transparent", border: "none", cursor: "pointer" }}>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, fontWeight: 600, textAlign: "left", color: uploading ? "var(--gs-muted)" : "var(--foreground)", background: uploading ? "#F0EEE6" : "var(--background)", border: "1.5px dashed var(--border)", borderRadius: 6, cursor: uploading ? "not-allowed" : "pointer" }}
        >
          {uploading ? "Uploading…" : "+ Upload receipt (image or PDF)"}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
        onChange={handleFileChange}
      />
      {uploadError && <p style={{ fontSize: 12, color: "var(--gs-danger)", marginTop: 5 }}>{uploadError}</p>}
    </div>
  );
}

export function ExpenseForm({ groupId, editExpense, onDone }: { groupId: string | null; editExpense?: Expense; onDone?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [category, setCategory] = useState<ExpenseInput["category"]>(editExpense?.category ?? "travel");
  const [billUrl, setBillUrl] = useState(editExpense?.bill_url ?? "");

  useEffect(() => {
    if (groupId) return;
    getGroupsForSelect().then(data => setGroups(data as unknown as typeof groups)).catch(() => setGroups([]));
  }, [groupId]);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
  };

  const subOptions = SUBCATEGORY_OPTIONS[category];
  const needsVolunteerCount = VOLUNTEER_COUNT_CATEGORIES.includes(category);
  const currentCategory = CATEGORIES.find(c => c.value === category)!;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      group_id: groupId || (fd.get("group_id") as string),
      category,
      subcategory: (fd.get("subcategory") as string) || undefined,
      volunteer_count: needsVolunteerCount ? Number(fd.get("volunteer_count")) : undefined,
      vendor_name: (fd.get("vendor_name") as string) || undefined,
      expense_date: fd.get("expense_date") as string,
      amount: Number(fd.get("amount")),
      bill_url: (fd.get("bill_url") as string) || undefined,
      description: (fd.get("description") as string) || undefined,
    };
    try {
      const result = editExpense
        ? await resubmitExpense(editExpense.id, payload)
        : await submitExpense(payload);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(editExpense ? "Expense resubmitted for approval" : "Expense submitted successfully");
      if (editExpense) {
        onDone?.();
      } else {
        (e.target as HTMLFormElement).reset();
        setCategory("travel");
        setBillUrl("");
      }
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
    <Card>
<CardContent>
<form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 14px" }}>{editExpense ? "Resubmit Expense" : "Submit Expense"}</h2>
      {error && (
        <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--gs-danger)" }}>
          {error}
        </div>
      )}
      <div className="space-y-3">
        {!groupId && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Group <span style={{ color: "var(--gs-danger)" }}>*</span></label>
            <select name="group_id" required style={inputStyle}>
              <option value="">Select group...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Category <span style={{ color: "var(--gs-danger)" }}>*</span></label>
          <select name="category" required value={category} onChange={e => setCategory(e.target.value as ExpenseInput["category"])} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 4 }}>{currentCategory.hint}</p>
        </div>

        {subOptions ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Type <span style={{ color: "var(--gs-danger)" }}>*</span></label>
            <select name="subcategory" required defaultValue={editExpense?.subcategory ?? ""} style={inputStyle}>
              <option value="" disabled>Select type...</option>
              {subOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>
              {category === "materials" ? "Items Purchased" : "Purpose of Expense"} <span style={{ color: "var(--gs-danger)" }}>*</span>
            </label>
            <input
              name="subcategory"
              type="text"
              required
              defaultValue={editExpense?.subcategory ?? ""}
              placeholder={category === "materials" ? "e.g. stationery, science materials, printing, teaching aids, banners..." : "Describe the purpose of this expense..."}
              style={inputStyle}
            />
          </div>
        )}

        {needsVolunteerCount && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Number of Volunteers <span style={{ color: "var(--gs-danger)" }}>*</span></label>
            <input name="volunteer_count" type="number" min="1" step="1" required defaultValue={editExpense?.volunteer_count ?? ""} placeholder="How many volunteers?" style={inputStyle} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "var(--gs-danger)" }}>*</span></label>
            <input name="amount" type="number" min="0" step="0.01" required defaultValue={editExpense?.amount ?? ""} placeholder="Enter amount" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Date <span style={{ color: "var(--gs-danger)" }}>*</span></label>
            <input name="expense_date" type="date" required defaultValue={editExpense?.expense_date ?? new Date().toISOString().split("T")[0]} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Name of Person / Vendor</label>
          <input name="vendor_name" type="text" defaultValue={editExpense?.vendor_name ?? ""} placeholder="Who was paid?" style={inputStyle} />
        </div>

        <input type="hidden" name="bill_url" value={billUrl} />
        <ReceiptUpload value={billUrl} onChange={setBillUrl} />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Additional Notes</label>
          <textarea name="description" rows={2} defaultValue={editExpense?.description ?? ""} placeholder="Anything else to add..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} style={{ marginTop: 14, background: "var(--gs-success)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : editExpense ? "Resubmit Expense" : "Submit Expense"}
        </button>
        {editExpense && (
          <button type="button" onClick={onDone} style={{ marginTop: 14, background: "transparent", color: "var(--gs-text-secondary)", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid var(--border)", cursor: "pointer" }}>
            Cancel
          </button>
        )}
      </div>
    </form>
</CardContent>
</Card>
  );
}
