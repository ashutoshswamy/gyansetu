"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createIdCard } from "@/actions/id-cards";

export default function NewIdCardPage() {
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
      await createIdCard({
        volunteer_id: fd.get("volunteer_id") as string,
        card_number: fd.get("card_number") as string,
        valid_from: fd.get("valid_from") as string,
        valid_to: fd.get("valid_to") as string,
        card_file_url: (fd.get("card_file_url") as string) || undefined,
      });
      router.push("/admin/id-cards");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue ID card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Issue ID Card</h1>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Card Number <span style={{ color: "#DC2626" }}>*</span></label>
              <input name="card_number" required style={inputStyle} placeholder="e.g. GS-2026-0001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid From <span style={{ color: "#DC2626" }}>*</span></label>
                <input name="valid_from" type="date" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid To <span style={{ color: "#DC2626" }}>*</span></label>
                <input name="valid_to" type="date" required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Card Photo/File URL (optional)</label>
              <input name="card_file_url" type="url" style={inputStyle} placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Issuing..." : "Issue ID Card"}
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
