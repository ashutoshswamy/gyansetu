"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createKitItem } from "@/actions/kits";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

export function KitItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createKitItem({
        name: fd.get("name") as string,
        category: (fd.get("category") as string) || undefined,
        quantity_per_school: Number(fd.get("quantity_per_school")) || 1,
        notes: (fd.get("notes") as string) || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast.success("Kit item added successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add kit item";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>Item Name *</label>
          <input name="name" required style={inputStyle} placeholder="e.g. Backpack" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>Category</label>
          <input name="category" style={inputStyle} placeholder="e.g. Apparel" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>Qty / School *</label>
          <input name="quantity_per_school" type="number" min={1} defaultValue={1} required style={inputStyle} />
        </div>
        <div>
          <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%" }}>
            {loading ? "Adding..." : "+ Add Item"}
          </button>
        </div>
      </div>
      <div className="mt-3">
        <label style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 4 }}>Notes</label>
        <input name="notes" style={inputStyle} placeholder="Optional notes" />
      </div>
    </form>
  );
}
