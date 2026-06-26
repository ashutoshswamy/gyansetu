import { createServerClient } from "@/lib/supabase/server";
import { NewFormBuilder } from "./new-form-builder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewFormPage() {
  const db = createServerClient();
  const [{ data: tours }, { data: templates }] = await Promise.all([
    db
      .from("tours")
      .select("id, title")
      .order("created_at", { ascending: false }),
    db
      .from("dynamic_forms")
      .select("*")
      .eq("is_template", true)
      .order("title", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/forms" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Forms
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F" }}>New Dynamic Form</h1>
        </div>
        <NewFormBuilder tours={tours ?? []} templates={templates ?? []} />
      </div>
    </div>
  );
}
