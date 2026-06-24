import { createServerClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/features/export-button";
import { ApproveRejectButtons } from "./approve-button";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

const testStatusStyles: Record<string, { color: string; background: string }> = {
  active: { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
  draft:  { color: "#F5A520", background: "rgba(245,165,32,0.08)" },
  closed: { color: "#9B9188", background: "rgba(90,82,71,0.08)" },
};

export default async function AdminTestsPage() {
  const db = createServerClient();

  const [{ data: tests }, { data: attempts }] = await Promise.all([
    db
      .from("eligibility_tests")
      .select("*, tours(title, destination)")
      .order("created_at", { ascending: false }),
    db
      .from("test_attempts")
      .select("id, test_id, score, status, student_id, users(name, email)")
      .order("submitted_at", { ascending: false }),
  ]);

  const attemptsByTest = (attempts ?? []).reduce(
    (acc: Record<string, any[]>, a: any) => {
      if (!acc[a.test_id]) acc[a.test_id] = [];
      acc[a.test_id].push(a);
      return acc;
    },
    {}
  );

  const exportData = (tests ?? []).flatMap((t: any) => {
    const testAttempts = attemptsByTest[t.id] ?? [];
    if (testAttempts.length === 0) {
      return [{ test: t.title, tour: t.tours?.title ?? "-", attempts: 0, avg_score: "-", pass_rate: "-" }];
    }
    const scores = testAttempts.map((a: any) => a.score ?? 0);
    const avg = scores.reduce((s: number, n: number) => s + n, 0) / scores.length;
    const passed = testAttempts.filter((a: any) => (a.score ?? 0) >= t.passing_score).length;
    return [{
      test: t.title,
      tour: t.tours?.title ?? "-",
      attempts: testAttempts.length,
      avg_score: avg.toFixed(1) + "%",
      pass_rate: ((passed / testAttempts.length) * 100).toFixed(0) + "%",
    }];
  });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Eligibility Tests</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {tests?.length ?? 0} tests &middot; results and pass rates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton data={exportData} filename="test-results.csv" />
            <Link href="/admin/tests/new">
              <button
                className="flex items-center gap-2"
                style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}
              >
                <Plus className="w-4 h-4" />
                New Test
              </button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {(tests ?? []).length === 0 && (
            <div
              className="py-16 text-center rounded-xl"
              style={{ background: "white", border: "1px solid #E4DFD1" }}
            >
              <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>
                No tests created yet.
              </p>
            </div>
          )}

          {(tests ?? []).map((test: any) => {
            const testAttempts = attemptsByTest[test.id] ?? [];
            const scores = testAttempts.map((a: any) => a.score ?? 0);
            const avg =
              scores.length > 0
                ? scores.reduce((s: number, n: number) => s + n, 0) / scores.length
                : null;
            const passed = testAttempts.filter(
              (a: any) => (a.score ?? 0) >= test.passing_score
            ).length;
            const s = testStatusStyles[test.status] ?? testStatusStyles.draft;

            return (
              <div
                key={test.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "white", border: "1px solid #E4DFD1" }}
              >
                {/* Test header */}
                <div className="flex items-center justify-between p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }}>{test.title}</h3>
                      <span
                        style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.background, textTransform: "capitalize" }}
                      >
                        {test.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
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
                          <p style={{ fontWeight: 700, fontSize: 20, lineHeight: 1, color: "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>
                            {testAttempts.length}
                          </p>
                          <p style={{ fontSize: 11, marginTop: 2, color: "#9B9188" }}>attempts</p>
                        </div>
                        {avg !== null && (
                          <div className="text-center">
                            <p style={{
                              fontWeight: 700,
                              fontSize: 20,
                              lineHeight: 1,
                              color: avg >= test.passing_score ? "#2A5E3A" : "#B8381E",
                              fontFamily: "var(--font-geist-mono), monospace",
                            }}>
                              {avg.toFixed(0)}%
                            </p>
                            <p style={{ fontSize: 11, marginTop: 2, color: "#9B9188" }}>avg score</p>
                          </div>
                        )}
                        <div className="text-center">
                          <p style={{ fontWeight: 700, fontSize: 20, lineHeight: 1, color: "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>
                            {testAttempts.length > 0
                              ? Math.round((passed / testAttempts.length) * 100)
                              : 0}%
                          </p>
                          <p style={{ fontSize: 11, marginTop: 2, color: "#9B9188" }}>pass rate</p>
                        </div>
                      </>
                    )}
                    <Link href={`/admin/tests/${test.id}`}>
                      <button
                        style={{ background: "transparent", color: "#4A55BE", fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}
                      >
                        Manage
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Attempt results */}
                {testAttempts.length > 0 && (
                  <div
                    className="px-5 pb-4"
                    style={{ borderTop: "1px solid #E4DFD1" }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", paddingTop: 12, paddingBottom: 8 }}>
                      Results
                    </p>
                    <div className="space-y-1.5">
                      {testAttempts.slice(0, 8).map((attempt: any) => {
                        const score = attempt.score ?? 0;
                        const isPendingApproval = attempt.status === "pending_approval";
                        const isApproved = attempt.status === "approved";
                        const isRejected = attempt.status === "rejected";
                        const didPass = score >= test.passing_score;

                        let statusLabel = didPass ? "Passed" : "Failed";
                        let statusColor = didPass ? "#2A5E3A" : "#B8381E";
                        let statusBg = didPass ? "rgba(42,94,58,0.08)" : "rgba(184,56,30,0.08)";
                        if (isPendingApproval) { statusLabel = "Pending Approval"; statusColor = "#F5A520"; statusBg = "rgba(245,165,32,0.08)"; }
                        if (isApproved)        { statusLabel = "Approved ✓";       statusColor = "#2A5E3A"; statusBg = "rgba(42,94,58,0.12)"; }
                        if (isRejected)        { statusLabel = "Rejected";          statusColor = "#B8381E"; statusBg = "rgba(184,56,30,0.08)"; }

                        return (
                          <div
                            key={`${attempt.test_id}-${attempt.student_id}`}
                            className="flex items-center justify-between py-2.5 px-3 rounded"
                            style={{ background: isPendingApproval ? "rgba(245,165,32,0.05)" : "#F3F0E8", border: isPendingApproval ? "1px solid rgba(245,165,32,0.2)" : "none" }}
                          >
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 500, color: "#19140F" }}>
                                {attempt.users?.name ?? "Unknown"}
                              </p>
                              <p style={{ fontSize: 11, color: "#9B9188" }}>{attempt.users?.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ fontSize: 12, fontFamily: "monospace", color: didPass ? "#2A5E3A" : "#B8381E" }}>
                                {score.toFixed(1)}%
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: statusColor, background: statusBg }}>
                                {statusLabel}
                              </span>
                              {isPendingApproval && <ApproveRejectButtons attemptId={attempt.id} />}
                            </div>
                          </div>
                        );
                      })}
                      {testAttempts.length > 8 && (
                        <p style={{ fontSize: 12, textAlign: "center", paddingTop: 4, color: "#9B9188" }}>
                          +{testAttempts.length - 8} more results
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
