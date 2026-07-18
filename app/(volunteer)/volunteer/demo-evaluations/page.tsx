import { getMyDemoEvaluations } from "@/actions/demo-evaluations";
import { ClipboardCheck } from "lucide-react";

const SCORE_FIELDS = [
  { key: "content_delivery", label: "Content Delivery" },
  { key: "hindi_communication", label: "Hindi Communication" },
  { key: "team_coordination", label: "Team Coordination" },
  { key: "classroom_management", label: "Classroom Management" },
  { key: "activity_flow", label: "Activity Flow" },
  { key: "confidence", label: "Confidence" },
  { key: "student_engagement", label: "Student Engagement" },
] as const;

function scoreColor(total: number) {
  if (total >= 56) return "#2A5E3A";
  if (total >= 35) return "#F5A520";
  return "#DC2626";
}

export default async function VolunteerDemoEvaluationsPage() {
  const evaluations = await getMyDemoEvaluations();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Demo Evaluations</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} received</p>
        </div>

        {evaluations.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247", marginBottom: 4 }}>No demo evaluations yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>Evaluations from observers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((e) => {
              const scores = e.scores as Record<string, number>;
              const color = scoreColor(e.total_score);
              return (
                <div key={e.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 22px" }}>
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: 0 }}>{e.tour?.title ?? "General"}</h3>
                      <p style={{ fontSize: 12, color: "#9B9188", marginTop: 4 }}>{new Date(e.evaluated_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color, background: "rgba(0,0,0,0.03)", padding: "4px 12px", borderRadius: 6 }}>
                      {e.total_score} / 70
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {SCORE_FIELDS.map(f => (
                      <div key={f.key} style={{ background: "#FAFAF7", border: "1px solid #E4DFD1", borderRadius: 6, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#19140F", margin: 0 }}>{scores?.[f.key] ?? "-"}</p>
                      </div>
                    ))}
                  </div>
                  {e.remarks && (
                    <p style={{ fontSize: 13, color: "#5A5247", padding: "8px 12px", background: "#FAFAF7", borderRadius: 6 }}>{e.remarks}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
