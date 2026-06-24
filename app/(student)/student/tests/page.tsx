import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    ? await db.from("eligibility_tests").select("*").in("tour_id", tourIds).eq("status", "active")
    : { data: [] };

  const { data: attempts } = await db
    .from("test_attempts")
    .select("test_id, score, status")
    .eq("student_id", user?.id ?? "");

  const attemptMap = new Map((attempts ?? []).map((a) => [a.test_id, a]));

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Eligibility Tests</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Tests for your applied tours</p>
        </div>

        <div className="space-y-3">
          {(tests ?? []).length === 0 && (
            <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "48px 0" }}>
              No active tests available. Apply for tours to unlock tests.
            </p>
          )}
          {(tests ?? []).map((test: any) => {
            const attempt = attemptMap.get(test.id);
            const passed = attempt?.score !== null && attempt?.score !== undefined && attempt.score >= test.passing_score;
            return (
              <div key={test.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 6px" }}>{test.title}</h3>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#9B9188" }}>
                    <span>{test.questions?.length ?? 0} questions</span>
                    <span>{test.duration_minutes} min</span>
                    <span>Pass: {test.passing_score}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 16 }}>
                  {attempt ? (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#19140F", fontFamily: "monospace" }}>{attempt.score?.toFixed(1)}%</span>
                      {attempt.status === "pending_approval" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: "#B45309", background: "rgba(245,165,32,0.08)" }}>
                          Pending Approval
                        </span>
                      ) : attempt.status === "approved" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)" }}>
                          Approved
                        </span>
                      ) : attempt.status === "rejected" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: "#B8381E", background: "rgba(184,56,30,0.08)" }}>
                          Rejected
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: passed ? "#2A5E3A" : "#B8381E", background: passed ? "rgba(42,94,58,0.08)" : "rgba(184,56,30,0.08)" }}>
                          {passed ? "Passed" : "Failed"}
                        </span>
                      )}
                    </>
                  ) : (
                    <Link href={`/student/tests/${test.id}`}>
                      <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
                        Start Test
                      </button>
                    </Link>
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
