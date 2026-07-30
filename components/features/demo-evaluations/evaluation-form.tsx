"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { createDemoEvaluation, updateDemoEvaluation } from "@/actions/demo-evaluations";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import type { DemoEvaluation } from "@/types";

export const SCORE_FIELDS = [
  { key: "hindi_english_communication", label: "Hindi / English Communication" },
  { key: "concept_clarity", label: "Concept Clarity" },
  { key: "communication_skills", label: "Communication Skills" },
  { key: "presentation_skills", label: "Presentation Skills" },
  { key: "confidence_body_language", label: "Confidence & Body Language" },
  { key: "student_engagement", label: "Student Engagement" },
  { key: "activity_demonstration", label: "Activity Demonstration" },
  { key: "team_coordination", label: "Team Coordination" },
  { key: "time_session_management", label: "Time & Session Management" },
  { key: "overall_readiness", label: "Overall Readiness" },
] as const;

type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];

// score 0-10, 10 whole stars, one star = one point
export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          aria-label={`${star} of 10`}
          onClick={() => onChange(star === value ? 0 : star)}
          style={{ padding: 0, border: "none", background: "none", cursor: "pointer", lineHeight: 0 }}
        >
          <Star
            size={18}
            color={star <= value ? "#F5A524" : "#E4DFD1"}
            fill={star <= value ? "#F5A524" : "#E4DFD1"}
          />
        </button>
      ))}
      <span style={{ fontSize: 12, color: "#5A5247", marginLeft: 6, minWidth: 24 }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
};

export function EvaluationForm({ evaluation }: { evaluation?: DemoEvaluation }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState(evaluation?.volunteer_id ?? "");
  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    Object.fromEntries(SCORE_FIELDS.map(f => [f.key, evaluation?.scores?.[f.key] ?? 0])) as Record<ScoreKey, number>
  );
  const [intent, setIntent] = useState<"draft" | "submitted">("submitted");

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const payload = {
        volunteer_id: fd.get("volunteer_id") as string,
        tour_id: (fd.get("tour_id") as string) || undefined,
        scores,
        remarks: (fd.get("remarks") as string) || undefined,
        status: intent,
      };
      if (evaluation) {
        await updateDemoEvaluation(evaluation.id, payload);
      } else {
        await createDemoEvaluation(payload);
      }
      router.push("/admin/demo-evaluations");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save evaluation";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>
            {evaluation ? "Edit Demo Evaluation" : "New Demo Evaluation"}
          </h1>
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
              <select name="tour_id" defaultValue={evaluation?.tour_id ?? ""} style={inputStyle}>
                <option value="">General (no specific tour)</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#19140F", display: "block", marginBottom: 10 }}>Scores (0-10 each · 10 parameters)</label>
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
              <textarea name="remarks" rows={3} defaultValue={evaluation?.remarks ?? ""} placeholder="Observations, feedback..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              onClick={() => setIntent("submitted")}
              style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading && intent === "submitted" ? "Submitting..." : "Submit Evaluation"}
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setIntent("draft")}
              style={{ background: "white", color: "#4A55BE", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #4A55BE", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading && intent === "draft" ? "Saving..." : "Save Draft"}
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
