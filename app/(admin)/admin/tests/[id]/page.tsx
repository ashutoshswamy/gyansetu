import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TestAttemptsViewer, type Attempt } from "./attempts-viewer";

export default async function TestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: test, error: testError }, { data: attempts }] = await Promise.all([
    db
      .from("eligibility_tests")
      .select("*, tours!eligibility_tests_tour_id_fkey(title)")
      .eq("id", id)
      .single(),
    db
      .from("test_attempts")
      .select("*, users(name, email)")
      .eq("test_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  if (testError || !test) notFound();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link href="/admin/tests" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tests
        </Link>

        {/* Test Header */}
        <div className="rounded-xl p-6 mb-6 bg-white border" style={{ borderColor: "#E4DFD1" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188" }}>
            Admin Console &middot; Test Details
          </span>
          <h1 className="mt-1" style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: "4px 0 6px 0" }}>
            {test.title}
          </h1>
          {test.description && (
            <p style={{ fontSize: 14, color: "#5A5247", margin: "0 0 12px 0" }}>{test.description}</p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t text-[#5A5247]" style={{ fontSize: 13, borderColor: "#F3F0E8" }}>
            <span><strong>Tour:</strong> {test.tours?.title ?? "Unlinked"}</span>
            <span><strong>Passing Score:</strong> {test.passing_score}%</span>
            <span><strong>Duration:</strong> {test.duration_minutes} minutes</span>
            <span><strong>Questions:</strong> {test.questions?.length ?? 0} total</span>
            <span><strong>Status:</strong> <span style={{ textTransform: "capitalize", fontWeight: 600, color: test.status === "active" ? "#2A5E3A" : "#F5A520" }}>{test.status}</span></span>
          </div>
        </div>

        {/* Attempts Table / Panel Split Viewer */}
        <TestAttemptsViewer test={test} attempts={(attempts ?? []) as Attempt[]} />
      </div>
    </div>
  );
}
