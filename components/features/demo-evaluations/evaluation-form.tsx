"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { createDemoEvaluation, updateDemoEvaluation } from "@/actions/demo-evaluations";
import { getCurrentTourForVolunteer } from "@/actions/groups";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import type { DemoEvaluation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
            color={star <= value ? "#F5A524" : "var(--border)"}
            fill={star <= value ? "#F5A524" : "var(--border)"}
          />
        </button>
      ))}
      <span style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginLeft: 6, minWidth: 24 }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
  background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
};

export function EvaluationForm({ evaluation }: { evaluation?: DemoEvaluation }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState(evaluation?.volunteer_id ?? "");
  const [tourId, setTourId] = useState(evaluation?.tour_id ?? "");
  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    Object.fromEntries(SCORE_FIELDS.map(f => [f.key, evaluation?.scores?.[f.key] ?? 0])) as Record<ScoreKey, number>
  );
  const [intent, setIntent] = useState<"draft" | "submitted">("submitted");

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  function handleVolunteerChange(id: string) {
    setVolunteerId(id);
    if (!id || evaluation) return;
    getCurrentTourForVolunteer(id).then(info => {
      if (info?.tour_id) setTourId(info.tour_id);
    }).catch(() => {});
  }

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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            {evaluation ? "Edit Demo Evaluation" : "New Demo Evaluation"}
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Volunteer <span className="text-destructive">*</span></Label>
                  <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={handleVolunteerChange} name="volunteer_id" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Tour (optional)</Label>
                  <Select
                    value={tourId}
                    onValueChange={(val) => setTourId(val ?? "")}
                    items={[{ value: "", label: "General (no specific tour)" }, ...tours.map(t => ({ value: t.id, label: t.title }))]}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="General (no specific tour)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General (no specific tour)</SelectItem>
                      {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground block mb-3">Scores (0-10 each · 10 parameters)</Label>
                  <div className="space-y-3">
                    {SCORE_FIELDS.map(f => (
                      <div key={f.key} className="flex items-center justify-between gap-4">
                        <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
                        <StarRating value={scores[f.key]} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Remarks</Label>
                  <Textarea name="remarks" rows={3} defaultValue={evaluation?.remarks ?? ""} placeholder="Observations, feedback..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
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
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
