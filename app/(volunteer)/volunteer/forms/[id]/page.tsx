import { createServerClient } from "@/lib/supabase/server";
import { DynamicFormRenderer } from "@/components/features/forms/dynamic-form-renderer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DynamicForm } from "@/types";

export default async function VolunteerFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: form, error } = await db
    .from("dynamic_forms")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !form) notFound();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/volunteer/forms" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Forms
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{form.title}</h1>
          {form.description && <p style={{ fontSize: 14, color: "#5A5247", marginTop: 6 }}>{form.description}</p>}
        </div>
        <DynamicFormRenderer form={form as DynamicForm} />
      </div>
    </div>
  );
}
