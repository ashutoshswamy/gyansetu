import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { TestRunner } from "@/components/features/tests/test-runner";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const db = createServerClient();

  const { data: test, error } = await db
    .from("eligibility_tests")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !test || test.is_template) notFound();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId!).single();
  const { data: existingAttempt } = await db
    .from("test_attempts")
    .select("id, status, score")
    .eq("test_id", id)
    .eq("student_id", user?.id ?? "")
    .maybeSingle();

  if (existingAttempt) {
    const { status, score } = existingAttempt;
    const passed = (score ?? 0) >= test.passing_score;

    let banner: { title: string; box?: { color: string; bg: string; border: string; heading: string; body: string } } = {
      title: "Test Submitted",
    };
    if (status === "pending_approval") {
      banner = {
        title: "Test Passed",
        box: {
          color: "#B45309", bg: "rgba(245,165,32,0.07)", border: "rgba(245,165,32,0.25)",
          heading: "Pending Admin Approval",
          body: "Your result has been sent for admin review. Once approved, sign in again to access your volunteer dashboard.",
        },
      };
    } else if (status === "approved") {
      banner = {
        title: "Test Passed",
        box: {
          color: "#2A5E3A", bg: "rgba(42,94,58,0.07)", border: "rgba(42,94,58,0.25)",
          heading: "Approved",
          body: "Your result was approved. Sign in again if your dashboard hasn't updated yet.",
        },
      };
    } else if (status === "rejected") {
      banner = {
        title: "Test Reviewed",
        box: {
          color: "#B8381E", bg: "rgba(184,56,30,0.07)", border: "rgba(184,56,30,0.25)",
          heading: "Not Approved",
          body: "Your result was reviewed and not approved for this tour. Contact an admin if you have questions.",
        },
      };
    } else if (!passed) {
      banner = { title: "Test Submitted" };
    }

    return (
      <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
        <div className="max-w-3xl mx-auto text-center" style={{ paddingTop: 80 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#19140F", margin: "0 0 10px" }}>
            {banner.title}
          </h1>
          {score !== null && score !== undefined && (
            <p style={{ fontSize: 14, color: "#5A5247", marginBottom: 16 }}>
              Your score:{" "}
              <span style={{ fontWeight: 700, color: passed ? "#2A5E3A" : "#B8381E", fontFamily: "monospace" }}>
                {score.toFixed(1)}%
              </span>
            </p>
          )}
          {banner.box ? (
            <div style={{ background: banner.box.bg, border: `1px solid ${banner.box.border}`, borderRadius: 8, padding: "14px 20px", display: "inline-block", marginBottom: 20, maxWidth: 400, textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: banner.box.color, marginBottom: 4 }}>{banner.box.heading}</p>
              <p style={{ fontSize: 12, color: banner.box.color, lineHeight: 1.6, opacity: 0.85 }}>{banner.box.body}</p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#9B9188", marginBottom: 20 }}>
              Minimum required: {test.passing_score}%. Each test can only be attempted once.
            </p>
          )}
          <div>
            <Link href="/enrollee/tests" style={{ fontSize: 13, fontWeight: 600, color: "#4A55BE" }}>
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{test.title}</h1>
          {test.description && <p style={{ fontSize: 14, color: "#5A5247", marginTop: 6 }}>{test.description}</p>}
          <div className="flex gap-4 mt-3" style={{ fontSize: 12, color: "#9B9188" }}>
            <span>{test.questions?.length ?? 0} questions</span>
            <span>{test.duration_minutes} min</span>
            <span>Pass: {test.passing_score}%</span>
          </div>
        </div>
        <TestRunner test={test} />
      </div>
    </div>
  );
}
