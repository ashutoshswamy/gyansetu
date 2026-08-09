import { getDemoEvaluationById } from "@/actions/demo-evaluations";
import { SCORE_FIELDS } from "@/components/features/demo-evaluations/evaluation-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoEvaluation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

function scoreColor(total: number) {
  if (total >= 80) return "var(--gs-success)";
  if (total >= 50) return "var(--gs-warning)";
  return "var(--gs-danger)";
}

export default async function AdminDemoEvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = (await getDemoEvaluationById(id)) as DemoEvaluation;
  const color = scoreColor(evaluation.total_score ?? 0);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/demo-evaluations" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "var(--gs-muted)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Demo Evaluations
        </Link>

        <Card>
<CardContent>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{evaluation.volunteer?.name ?? "Unknown"}</h1>
              <p style={{ fontSize: 13, color: "var(--gs-muted)", margin: "4px 0 0" }}>{evaluation.volunteer?.email}</p>
              <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "6px 0 0" }}>
                {evaluation.tour?.title ?? "General"} · Observed by {evaluation.observer?.name ?? "-"} · {new Date(evaluation.evaluated_at).toLocaleDateString()}
              </p>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, padding: "4px 12px", borderRadius: 6, color, background: "rgba(0,0,0,0.03)" }}>
              {evaluation.total_score} / 100
            </span>
          </div>
        </CardContent>
</Card>

        <Card>
<CardContent>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", margin: "0 0 12px" }}>Scores (0-10 each)</p>
          <div className="space-y-2">
            {SCORE_FIELDS.map((f) => {
              const v = evaluation.scores[f.key];
              return (
                <div key={f.key} className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>{f.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-geist-mono), monospace" }}>{v} / 10</span>
                </div>
              );
            })}
          </div>
        </CardContent>
</Card>

        {evaluation.remarks && (
          <Card>
<CardContent>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Remarks</p>
            <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>{evaluation.remarks}</p>
          </CardContent>
</Card>
        )}
      </div>
    </div>
  );
}
