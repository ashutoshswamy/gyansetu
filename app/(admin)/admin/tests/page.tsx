import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/features/export-button";
import { ApproveRejectButtons } from "./approve-button";
import { TestRowActions } from "@/components/features/tests/test-row-actions";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const testStatusStyles: Record<string, { color: string; background: string }> = {
  active: { color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" },
  draft:  { color: "var(--gs-warning)", background: "rgba(var(--gs-warning-rgb), 0.08)" },
  closed: { color: "var(--gs-muted)", background: "rgba(90,82,71,0.08)" },
};

interface TestAttemptRow {
  id: string;
  test_id: string;
  score?: number;
  status: string;
  student_id: string;
  users?: { name: string; email: string };
}

interface TestRow {
  id: string;
  title: string;
  status: "draft" | "active" | "closed";
  duration_minutes: number;
  passing_score: number;
  questions?: unknown[];
  tours?: { title: string; destination: string };
}

export default async function AdminTestsPage() {
  const db = createServerClient();

  const [{ data: tests }, { data: attempts }] = await Promise.all([
    db
      .from("eligibility_tests")
      .select("*, tours!eligibility_tests_tour_id_fkey(title, destination)")
      .eq("is_template", false)
      .order("created_at", { ascending: false }),
    db
      .from("test_attempts")
      .select("id, test_id, score, status, student_id, users(name, email)")
      .order("submitted_at", { ascending: false }),
  ]);

  const attemptsByTest = ((attempts ?? []) as unknown as TestAttemptRow[]).reduce(
    (acc: Record<string, TestAttemptRow[]>, a) => {
      if (!acc[a.test_id]) acc[a.test_id] = [];
      acc[a.test_id].push(a);
      return acc;
    },
    {} as Record<string, TestAttemptRow[]>
  );

  const exportData = ((tests ?? []) as TestRow[]).flatMap((t) => {
    const testAttempts = attemptsByTest[t.id] ?? [];
    if (testAttempts.length === 0) {
      return [{ test: t.title, tour: t.tours?.title ?? "-", attempts: 0, avg_score: "-", pass_rate: "-" }];
    }
    const scores = testAttempts.map((a) => a.score ?? 0);
    const avg = scores.reduce((s: number, n: number) => s + n, 0) / scores.length;
    const passed = testAttempts.filter((a) => (a.score ?? 0) >= t.passing_score).length;
    return [{
      test: t.title,
      tour: t.tours?.title ?? "-",
      attempts: testAttempts.length,
      avg_score: avg.toFixed(1) + "%",
      pass_rate: ((passed / testAttempts.length) * 100).toFixed(0) + "%",
    }];
  });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Eligibility Tests</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              {tests?.length ?? 0} tests &middot; results and pass rates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={exportData} filename="test-results.csv" />
            <Link href="/admin/tests/templates">
              <Button variant="outline">Test Templates</Button>
            </Link>
            <Link href="/admin/tests/new">
              <Button>
                <Plus className="w-4 h-4" />
                New Test
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {(tests ?? []).length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>
                  No tests created yet.
                </p>
              </CardContent>
            </Card>
          )}

          {((tests ?? []) as TestRow[]).map((test) => {
            const testAttempts = attemptsByTest[test.id] ?? [];
            const scores = testAttempts.map((a) => a.score ?? 0);
            const avg =
              scores.length > 0
                ? scores.reduce((s: number, n: number) => s + n, 0) / scores.length
                : null;
            const passed = testAttempts.filter(
              (a) => (a.score ?? 0) >= test.passing_score
            ).length;
            const s = testStatusStyles[test.status] ?? testStatusStyles.draft;

            return (
              <Card key={test.id}>
                {/* Test header */}
                <div className="flex items-center justify-between p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{test.title}</h3>
                      <Badge style={{ color: s.color, background: s.background, textTransform: "capitalize" }}>
                        {test.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      <span>Tour: {test.tours?.title ?? "Unlinked"}</span>
                      <span>{test.questions?.length ?? 0} questions</span>
                      <span>{test.duration_minutes} min</span>
                      <span>Pass: {test.passing_score}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0 ml-6">
                    {testAttempts.length > 0 && (
                      <>
                        <div className="text-center">
                          <p style={{ fontWeight: 700, fontSize: 20, lineHeight: 1, color: "var(--gs-accent)", fontFamily: "var(--font-geist-mono), monospace" }}>
                            {testAttempts.length}
                          </p>
                          <p style={{ fontSize: 11, marginTop: 2, color: "var(--gs-muted)" }}>attempts</p>
                        </div>
                        {avg !== null && (
                          <div className="text-center">
                            <p style={{
                              fontWeight: 700,
                              fontSize: 20,
                              lineHeight: 1,
                              color: avg >= test.passing_score ? "var(--gs-success)" : "var(--gs-danger-alt)",
                              fontFamily: "var(--font-geist-mono), monospace",
                            }}>
                              {avg.toFixed(0)}%
                            </p>
                            <p style={{ fontSize: 11, marginTop: 2, color: "var(--gs-muted)" }}>avg score</p>
                          </div>
                        )}
                        <div className="text-center">
                          <p style={{ fontWeight: 700, fontSize: 20, lineHeight: 1, color: "var(--gs-accent)", fontFamily: "var(--font-geist-mono), monospace" }}>
                            {testAttempts.length > 0
                              ? Math.round((passed / testAttempts.length) * 100)
                              : 0}%
                          </p>
                          <p style={{ fontSize: 11, marginTop: 2, color: "var(--gs-muted)" }}>pass rate</p>
                        </div>
                      </>
                    )}
                    <Link href={`/admin/tests/${test.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                    <TestRowActions testId={test.id} status={test.status} />
                  </div>
                </div>

                {/* Attempt results */}
                {testAttempts.length > 0 && (
                  <div
                    className="px-5 pb-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-muted)", paddingTop: 12, paddingBottom: 8 }}>
                      Results
                    </p>
                    <div className="space-y-1.5">
                      {testAttempts.slice(0, 8).map((attempt) => {
                        const score = attempt.score ?? 0;
                        const isPendingApproval = attempt.status === "pending_approval";
                        const isApproved = attempt.status === "approved";
                        const isRejected = attempt.status === "rejected";
                        const didPass = score >= test.passing_score;

                        let statusLabel = didPass ? "Passed" : "Failed";
                        let statusColor = didPass ? "var(--gs-success)" : "var(--gs-danger-alt)";
                        let statusBg = didPass ? "rgba(var(--gs-success-rgb), 0.08)" : "rgba(var(--gs-danger-alt-rgb), 0.08)";
                        if (isPendingApproval) { statusLabel = "Pending Approval"; statusColor = "var(--gs-warning)"; statusBg = "rgba(var(--gs-warning-rgb), 0.08)"; }
                        if (isApproved)        { statusLabel = "Approved ✓";       statusColor = "var(--gs-success)"; statusBg = "rgba(var(--gs-success-rgb), 0.12)"; }
                        if (isRejected)        { statusLabel = "Rejected";          statusColor = "var(--gs-danger-alt)"; statusBg = "rgba(var(--gs-danger-alt-rgb), 0.08)"; }

                        return (
                          <div
                            key={`${attempt.test_id}-${attempt.student_id}`}
                            className="flex items-center justify-between py-2.5 px-3 rounded"
                            style={{ background: isPendingApproval ? "rgba(var(--gs-warning-rgb), 0.05)" : "var(--gs-card)", border: isPendingApproval ? "1px solid rgba(var(--gs-warning-rgb), 0.2)" : "none" }}
                          >
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
                                {attempt.users?.name ?? "Unknown"}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--gs-muted)" }}>{attempt.users?.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ fontSize: 12, fontFamily: "monospace", color: didPass ? "var(--gs-success)" : "var(--gs-danger-alt)" }}>
                                {score.toFixed(1)}%
                              </span>
                              <Badge style={{ color: statusColor, background: statusBg }}>
                                {statusLabel}
                              </Badge>
                              {isPendingApproval && <ApproveRejectButtons attemptId={attempt.id} />}
                            </div>
                          </div>
                        );
                      })}
                      {testAttempts.length > 8 && (
                        <p style={{ fontSize: 12, textAlign: "center", paddingTop: 4, color: "var(--gs-muted)" }}>
                          +{testAttempts.length - 8} more results
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
