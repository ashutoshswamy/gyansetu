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
    .select("id")
    .eq("test_id", id)
    .eq("student_id", user?.id ?? "")
    .maybeSingle();

  if (existingAttempt) {
    return (
      <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
        <div className="max-w-3xl mx-auto text-center" style={{ paddingTop: 80 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#19140F", margin: "0 0 10px" }}>
            You have already submitted this test
          </h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginBottom: 20 }}>
            Each test can only be attempted once.
          </p>
          <Link href="/student/tests" style={{ fontSize: 13, fontWeight: 600, color: "#4A55BE" }}>
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
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
