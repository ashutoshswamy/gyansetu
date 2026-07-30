"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCORE_FIELDS, StarRating } from "@/components/features/demo-evaluations/evaluation-form";
import { createDemoEvaluationForVolunteer, updateDemoEvaluationForVolunteer } from "@/actions/core-member";
import type { DemoEvaluation } from "@/types";

type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
};

// Same fields/rating UI as the admin EvaluationForm, but the volunteer is fixed (no
// combobox — a core member is only ever evaluating one specific volunteer in their group)
// and it writes through the core-member-gated actions instead of the admin ones.
export function CoreMemberEvaluationForm({
  groupId, volunteerId, tourId, evaluation, onDone,
}: {
  groupId: string;
  volunteerId: string;
  tourId?: string | null;
  evaluation?: DemoEvaluation;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    Object.fromEntries(SCORE_FIELDS.map(f => [f.key, evaluation?.scores?.[f.key] ?? 0])) as Record<ScoreKey, number>
  );
  const [intent, setIntent] = useState<"draft" | "submitted">("submitted");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const payload = {
        volunteer_id: volunteerId,
        tour_id: tourId ?? undefined,
        scores,
        remarks: (fd.get("remarks") as string) || undefined,
        status: intent,
      };
      if (evaluation) {
        await updateDemoEvaluationForVolunteer(groupId, evaluation.id, payload);
      } else {
        await createDemoEvaluationForVolunteer(groupId, payload);
      }
      router.refresh();
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save evaluation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#FBF7EC", border: "1px solid #E4DFD1", borderRadius: 10, padding: 20, marginTop: 12 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <div className="space-y-3">
        {SCORE_FIELDS.map(f => (
          <div key={f.key} className="flex items-center justify-between gap-4">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247" }}>{f.label}</label>
            <StarRating value={scores[f.key]} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Remarks</label>
        <textarea name="remarks" rows={3} defaultValue={evaluation?.remarks ?? ""} placeholder="Observations, feedback..." style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div className="flex gap-3 mt-4">
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
        <button type="button" onClick={onDone} style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
