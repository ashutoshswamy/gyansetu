import { getAllDemoEvaluations } from "@/actions/demo-evaluations";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

function scoreColor(total: number) {
  if (total >= 80) return "#2A5E3A"; // 80%+
  if (total >= 50) return "#F5A520"; // 50%+
  return "#DC2626";
}

export default async function AdminDemoEvaluationsPage() {
  const evaluations = await getAllDemoEvaluations();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Demo Evaluations</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} recorded</p>
          </div>
          <Link href="/admin/demo-evaluations/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Evaluation
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {evaluations.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No evaluations recorded yet.</p>
          )}
          {evaluations.map((e) => {
            const color = scoreColor(e.total_score);
            return (
              <div key={e.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(74,85,190,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ClipboardCheck size={18} style={{ color: "#4A55BE" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{e.volunteer?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, color, background: "rgba(0,0,0,0.03)" }}>
                      {e.total_score} / 100
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9188" }}>
                    {e.tour?.title ?? "General"} · Observed by {e.observer?.name ?? "-"} · {new Date(e.evaluated_at).toLocaleDateString()}
                  </div>
                  {e.remarks && (
                    <p style={{ fontSize: 12, color: "#5A5247", marginTop: 6 }}>{e.remarks}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
