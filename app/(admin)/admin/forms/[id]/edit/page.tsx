import { createServerClient } from "@/lib/supabase/server";
import { NewFormBuilder } from "../../new/new-form-builder";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: form, error }, { data: tours }] = await Promise.all([
    db.from("dynamic_forms").select("*").eq("id", id).single(),
    db.from("tours").select("id, title").order("created_at", { ascending: false }),
  ]);

  if (error || !form) notFound();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/forms" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Forms
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F" }}>Edit Form</h1>
          <p style={{ fontSize: 13, color: "#9B9188", marginTop: 2 }}>{form.title}</p>
        </div>
        <NewFormBuilder
          tours={tours ?? []}
          initialData={{
            id: form.id,
            title: form.title,
            description: form.description ?? undefined,
            tour_id: form.tour_id ?? undefined,
            target_role: form.target_role,
            status: form.status,
            category: form.category ?? "general",
            is_template: !!form.is_template,
            fields: form.fields ?? [],
          }}
        />
      </div>
    </div>
  );
}
