import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { EligibilityTest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentTestsPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId!).single();

  const { data: applications } = await db
    .from("tour_applications")
    .select("tour_id, status")
    .eq("student_id", user?.id ?? "")
    .in("status", ["pending", "shortlisted"]);

  const tourIds = (applications ?? []).map((a) => a.tour_id);

  const { data: tests } = tourIds.length > 0
    ? await db.from("eligibility_tests").select("*").in("tour_id", tourIds).eq("status", "active").eq("is_template", false)
    : { data: [] };

  const { data: attempts } = await db
    .from("test_attempts")
    .select("test_id, score, status")
    .eq("student_id", user?.id ?? "");

  const attemptMap = new Map((attempts ?? []).map((a) => [a.test_id, a]));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Eligibility Tests</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Tests for your applied tours</p>
        </div>

        <div className="space-y-3">
          {(tests ?? []).length === 0 && (
            <p style={{ fontSize: 14, color: "var(--gs-muted)", textAlign: "center", padding: "48px 0" }}>
              No active tests available. Apply for tours to unlock tests.
            </p>
          )}
          {(tests ?? []).map((test: EligibilityTest) => {
            const attempt = attemptMap.get(test.id);
            const passed = attempt?.score !== null && attempt?.score !== undefined && attempt.score >= test.passing_score;
            return (
              <Card key={test.id}>
<CardContent>
                <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: "0 0 6px" }}>{test.title}</h3>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--gs-muted)" }}>
                    <span>{test.questions?.length ?? 0} questions</span>
                    <span>{test.duration_minutes} min</span>
                    <span>Pass: {test.passing_score}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 16 }}>
                  {attempt ? (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontFamily: "monospace" }}>{attempt.score?.toFixed(1)}%</span>
                      {attempt.status === "pending_approval" ? (
                        <Badge style={{color: "#B45309", background: "rgba(var(--gs-warning-rgb), 0.08)"}}>
                          Pending Approval
                        </Badge>
                      ) : attempt.status === "approved" ? (
                        <Badge style={{color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)"}}>
                          Approved
                        </Badge>
                      ) : attempt.status === "rejected" ? (
                        <Badge style={{color: "var(--gs-danger-alt)", background: "rgba(var(--gs-danger-alt-rgb), 0.08)"}}>
                          Rejected
                        </Badge>
                      ) : (
                        <Badge style={{color: passed ? "var(--gs-success)" : "var(--gs-danger-alt)", background: passed ? "rgba(var(--gs-success-rgb), 0.08)" : "rgba(var(--gs-danger-alt-rgb), 0.08)"}}>
                          {passed ? "Passed" : "Failed"}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Link href={`/enrollee/tests/${test.id}`}>
                      <Button size="sm">
                        Start Test
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
</Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
