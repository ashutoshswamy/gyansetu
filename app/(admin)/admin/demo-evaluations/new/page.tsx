"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDemoEvaluation } from "@/actions/demo-evaluations";

const SCORE_FIELDS = [
  { key: "content_delivery", label: "Content Delivery" },
  { key: "hindi_communication", label: "Hindi Communication" },
  { key: "team_coordination", label: "Team Coordination" },
  { key: "classroom_management", label: "Classroom Management" },
  { key: "activity_flow", label: "Activity Flow" },
  { key: "confidence", label: "Confidence" },
  { key: "student_engagement", label: "Student Engagement" },
] as const;

export default function NewDemoEvaluationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
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
      const scores = Object.fromEntries(
        SCORE_FIELDS.map(f => [f.key, Number(fd.get(f.key))])
      ) as Record<(typeof SCORE_FIELDS)[number]["key"], number>;
      await createDemoEvaluation({
        volunteer_id: fd.get("volunteer_id") as string,
        tour_id: (fd.get("tour_id") as string) || undefined,
        scores,
        remarks: (fd.get("remarks") as string) || undefined,
      });
      router.push("/admin/demo-evaluations");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create evaluation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>New Demo Evaluation</h1>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour (optional)</label>
              <select name="tour_id" style={inputStyle}>
                <option value="">General (no specific tour)</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#19140F", display: "block", marginBottom: 10 }}>Scores (0-10 each)</label>
              <div className="grid grid-cols-2 gap-4">
                {SCORE_FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input type="number" name={f.key} min={0} max={10} step="0.5" required defaultValue={0} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Remarks</label>
              <textarea name="remarks" rows={3} placeholder="Observations, feedback..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save Evaluation"}
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
