import { createServerClient } from "@/lib/supabase/server";
import { NewTestForm } from "../../new/new-test-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: test, error }, { data: tours }] = await Promise.all([
    db.from("eligibility_tests").select("*").eq("id", id).single(),
    db.from("tours").select("id, title").order("created_at", { ascending: false }),
  ]);

  if (error || !test) notFound();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/tests" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tests
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F" }}>Edit Test</h1>
          <p style={{ fontSize: 13, color: "#9B9188", marginTop: 2 }}>{test.title}</p>
        </div>
        <NewTestForm
          tours={tours ?? []}
          initialData={{
            id: test.id,
            title: test.title,
            description: test.description ?? undefined,
            tour_id: test.tour_id ?? undefined,
            duration_minutes: test.duration_minutes,
            passing_score: test.passing_score,
            status: test.status,
            is_template: !!test.is_template,
            questions: test.questions ?? [],
          }}
        />
      </div>
    </div>
  );
}
