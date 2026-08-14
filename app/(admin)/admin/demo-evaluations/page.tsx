import { getAllDemoEvaluations } from "@/actions/demo-evaluations";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function scoreColor(total: number) {
  if (total >= 80) return "var(--gs-success)"; // 80%+
  if (total >= 50) return "var(--gs-warning)"; // 50%+
  return "var(--gs-danger)";
}

export default async function AdminDemoEvaluationsPage() {
  const evaluations = await getAllDemoEvaluations();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Demo Evaluations</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} recorded</p>
          </div>
          <Link href="/admin/demo-evaluations/new">
            <Button>+ New Evaluation</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {evaluations.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No evaluations recorded yet.</p>
          )}
          {evaluations.map((e) => {
            const color = scoreColor(e.total_score);
            const isDraft = e.status === "draft";
            return (
              <Link key={e.id} href={isDraft ? `/admin/demo-evaluations/${e.id}/edit` : `/admin/demo-evaluations/${e.id}`} className="block">
                <Card>
<CardContent className="flex items-center gap-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(var(--gs-accent-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ClipboardCheck size={18} style={{ color: "var(--gs-accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{e.volunteer?.name ?? "Unknown"}</span>
                      {isDraft ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, color: "var(--gs-muted)", background: "rgba(0,0,0,0.03)" }}>
                          DRAFT
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, color, background: "rgba(0,0,0,0.03)" }}>
                          {e.total_score} / 100
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      {e.tour?.title ?? "General"} · Observed by {e.observer?.name ?? "-"} · {new Date(e.evaluated_at).toLocaleDateString()}
                      {isDraft && " · Click to resume"}
                    </div>
                    {e.remarks && (
                      <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 6 }}>{e.remarks}</p>
                    )}
                  </div>
                </CardContent>
</Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
