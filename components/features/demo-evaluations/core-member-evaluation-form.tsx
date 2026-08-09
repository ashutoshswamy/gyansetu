"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SCORE_FIELDS, StarRating } from "@/components/features/demo-evaluations/evaluation-form";
import { createDemoEvaluationForVolunteer, updateDemoEvaluationForVolunteer } from "@/actions/core-member";
import type { DemoEvaluation } from "@/types";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];

// Same fields/rating UI as the admin EvaluationForm, but the volunteer is fixed (no
// combobox — a core member is only ever evaluating one specific volunteer in their group)
// and it writes through the core-member-gated actions instead of the admin ones.
export function CoreMemberEvaluationForm({
  groupId, volunteerId, tourId, evaluation, onDone,
}: {
  groupId: string;
  volunteerId: string;
  tourId?: string | null;
  evaluation?: DemoEvaluation | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"submitted" | "draft">("submitted");
  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    Object.fromEntries(SCORE_FIELDS.map(f => [f.key, evaluation?.scores?.[f.key] ?? 0])) as Record<ScoreKey, number>
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (intent === "submitted") {
      const missing = SCORE_FIELDS.filter(f => !scores[f.key]);
      if (missing.length > 0) {
        const msg = `Rate all parameters before submitting (missing: ${missing.map(m => m.label).join(", ")})`;
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const remarks = (fd.get("remarks") as string) || undefined;
    const payload = {
      volunteer_id: volunteerId,
      tour_id: tourId || undefined,
      scores,
      remarks,
      status: intent,
    };

    try {
      if (evaluation) {
        await updateDemoEvaluationForVolunteer(groupId, evaluation.id, payload);
      } else {
        await createDemoEvaluationForVolunteer(groupId, payload);
      }
      toast.success(intent === "submitted" ? "Evaluation submitted" : "Draft saved");
      onDone();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save evaluation";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-3">
        {SCORE_FIELDS.map(f => (
          <div key={f.key} className="flex items-center justify-between gap-4">
            <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
            <StarRating value={scores[f.key]} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 mt-4">
        <Label className="text-xs font-semibold text-muted-foreground">Remarks</Label>
        <Textarea name="remarks" rows={3} defaultValue={evaluation?.remarks ?? ""} placeholder="Observations, feedback..." />
      </div>
      <div className="flex gap-3 mt-5">
        <Button
          type="submit"
          disabled={loading}
          onClick={() => setIntent("submitted")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {loading && intent === "submitted" ? "Submitting..." : "Submit Evaluation"}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          variant="outline"
          onClick={() => setIntent("draft")}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-600/10 font-semibold"
        >
          {loading && intent === "draft" ? "Saving..." : "Save Draft"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
