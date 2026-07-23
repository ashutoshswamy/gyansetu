"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createDemoEvaluation } from "@/actions/demo-evaluations";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";

const SCORE_FIELDS = [
  { key: "content_delivery", label: "Content Delivery" },
  { key: "hindi_communication", label: "Hindi Communication" },
  { key: "team_coordination", label: "Team Coordination" },
  { key: "classroom_management", label: "Classroom Management" },
  { key: "activity_flow", label: "Activity Flow" },
  { key: "confidence", label: "Confidence" },
  { key: "student_engagement", label: "Student Engagement" },
] as const;

type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];

// score 0-10 <-> 5 stars, half-star step (star value = score / 2)
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = Math.min(1, Math.max(0, value / 2 - (star - 1)));
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star * 2} of 10`}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX - rect.left < rect.width / 2;
              onChange(star * 2 - (half ? 1 : 0));
            }}
            style={{ position: "relative", width: 22, height: 22, padding: 0, border: "none", background: "none", cursor: "pointer", lineHeight: 0 }}
          >
            <Star size={22} color="#E4DFD1" fill="#E4DFD1" style={{ position: "absolute", top: 0, left: 0 }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: `${filled * 100}%`, height: "100%", overflow: "hidden" }}>
              <Star size={22} color="#F5A524" fill="#F5A524" />
            </div>
          </button>
        );
      })}
      <span style={{ fontSize: 12, color: "#5A5247", marginLeft: 6, minWidth: 28 }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function NewDemoEvaluationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    Object.fromEntries(SCORE_FIELDS.map(f => [f.key, 0])) as Record<ScoreKey, number>
  );

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
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={setVolunteerId} name="volunteer_id" />
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
              <div className="space-y-3">
                {SCORE_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center justify-between gap-4">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247" }}>{f.label}</label>
                    <StarRating value={scores[f.key]} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
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
