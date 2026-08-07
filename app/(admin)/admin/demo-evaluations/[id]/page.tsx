import { getDemoEvaluationById } from "@/actions/demo-evaluations";
import { SCORE_FIELDS } from "@/components/features/demo-evaluations/evaluation-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoEvaluation } from "@/types";

function scoreColor(total: number) {
  if (total >= 80) return "#2A5E3A";
  if (total >= 50) return "#F5A520";
  return "#DC2626";
}

export default async function AdminDemoEvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = (await getDemoEvaluationById(id)) as DemoEvaluation;
  const color = scoreColor(evaluation.total_score ?? 0);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/demo-evaluations" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Demo Evaluations
        </Link>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{evaluation.volunteer?.name ?? "Unknown"}</h1>
              <p style={{ fontSize: 13, color: "#9B9188", margin: "4px 0 0" }}>{evaluation.volunteer?.email}</p>
              <p style={{ fontSize: 12, color: "#5A5247", margin: "6px 0 0" }}>
                {evaluation.tour?.title ?? "General"} · Observed by {evaluation.observer?.name ?? "-"} · {new Date(evaluation.evaluated_at).toLocaleDateString()}
              </p>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, padding: "4px 12px", borderRadius: 6, color, background: "rgba(0,0,0,0.03)" }}>
              {evaluation.total_score} / 100
            </span>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#19140F", margin: "0 0 12px" }}>Scores (0-10 each)</p>
          <div className="space-y-2">
            {SCORE_FIELDS.map((f) => {
              const v = evaluation.scores[f.key];
              return (
                <div key={f.key} className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "#5A5247" }}>{f.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F", fontFamily: "var(--font-geist-mono), monospace" }}>{v} / 10</span>
                </div>
              );
            })}
          </div>
        </div>

        {evaluation.remarks && (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#19140F", margin: "0 0 8px" }}>Remarks</p>
            <p style={{ fontSize: 13, color: "#5A5247", margin: 0, whiteSpace: "pre-wrap" }}>{evaluation.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}
