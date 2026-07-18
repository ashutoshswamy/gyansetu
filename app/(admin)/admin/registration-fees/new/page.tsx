"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRegistrationFee } from "@/actions/registration-fees";
import type { RegistrationFeeInput } from "@/lib/validations";

const STATUSES = ["pending", "paid", "waived", "refunded"] as const;

export default function NewRegistrationFeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createRegistrationFee({
        volunteer_id: fd.get("volunteer_id") as string,
        amount: Number(fd.get("amount")),
        status: fd.get("status") as RegistrationFeeInput["status"],
        payment_reference: (fd.get("payment_reference") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      router.push("/admin/registration-fees");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record registration fee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Record Registration Fee</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Volunteer <span style={{ color: "#DC2626" }}>*</span></label>
              <select name="volunteer_id" required style={inputStyle}>
                <option value="">Select volunteer...</option>
                {volunteers.map(v => <option key={v.id} value={v.id}>{v.name} ({v.email})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Amount (₹) <span style={{ color: "#DC2626" }}>*</span></label>
              <input type="number" name="amount" min={0} step="0.01" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Status <span style={{ color: "#DC2626" }}>*</span></label>
              <select name="status" required defaultValue="pending" style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Payment Reference</label>
              <input type="text" name="payment_reference" placeholder="Transaction ID / UPI ref..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Additional notes..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Record Fee"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
