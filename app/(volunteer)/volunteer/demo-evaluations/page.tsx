import { getMyDemoEvaluations } from "@/actions/demo-evaluations";
import { formatDate } from "@/lib/format-date";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCORE_FIELDS = [
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

function scoreColor(total: number) {
  if (total >= 80) return "var(--gs-success)";
  if (total >= 50) return "var(--gs-warning)";
  return "var(--gs-danger)";
}

export default async function VolunteerDemoEvaluationsPage() {
  const evaluations = await getMyDemoEvaluations();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Demo Evaluations</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} received</p>
        </div>

        {evaluations.length === 0 ? (
          <Card>
<CardContent className="text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)", marginBottom: 4 }}>No demo evaluations yet.</p>
            <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Evaluations from observers will appear here.</p>
          </CardContent>
</Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((e) => {
              const scores = e.scores as Record<string, number>;
              const color = scoreColor(e.total_score);
              return (
                <Card key={e.id}>
<CardContent>
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{e.tour?.title ?? "General"}</h3>
                      <p style={{ fontSize: 12, color: "var(--gs-muted)", marginTop: 4 }}>{formatDate(e.evaluated_at)}</p>
                    </div>
                    <Badge style={{ fontSize: 18, fontWeight: 700, color, background: "rgba(0,0,0,0.03)", padding: "4px 12px" }}>
                      {e.total_score} / 100
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {SCORE_FIELDS.map(f => (
                      <Card key={f.key} size="sm">
                        <CardContent className="p-3">
                          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gs-muted)", marginBottom: 2 }}>{f.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{scores?.[f.key] ?? "-"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {e.remarks && (
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", padding: "8px 12px", background: "var(--background)", borderRadius: 6 }}>{e.remarks}</p>
                  )}
                </CardContent>
</Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
