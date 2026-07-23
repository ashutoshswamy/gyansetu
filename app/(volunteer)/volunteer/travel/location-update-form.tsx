"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postLocationUpdate } from "@/actions/travel";
import type { LocationUpdateInput } from "@/lib/validations";

const STATUS_OPTIONS: { value: NonNullable<LocationUpdateInput["status_type"]>; label: string }[] = [
  { value: "current_location", label: "Current Location" },
  { value: "train_delay", label: "Train Delay" },
  { value: "arrival_estimate", label: "Arrival Estimate" },
  { value: "other", label: "Other" },
];

export function LocationUpdateForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await postLocationUpdate({
        group_id: groupId,
        note: (fd.get("note") as string) || undefined,
        status_type: (fd.get("status_type") as LocationUpdateInput["status_type"]) || undefined,
        from_location: (fd.get("from_location") as string) || undefined,
        to_location: (fd.get("to_location") as string) || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast.success("Location updated successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post update";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 14px" }}>Post Location Update</h2>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Status Type</label>
            <select name="status_type" style={inputStyle}>
              <option value="">Select...</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>From</label>
            <input name="from_location" type="text" placeholder="e.g. New Delhi" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>To</label>
            <input name="to_location" type="text" placeholder="e.g. Mumbai Central" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Note</label>
          <textarea name="note" rows={2} placeholder="e.g. Train running 40 min late" style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      <button type="submit" disabled={saving} style={{ marginTop: 14, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Posting..." : "Post Update"}
      </button>
    </form>
  );
}
