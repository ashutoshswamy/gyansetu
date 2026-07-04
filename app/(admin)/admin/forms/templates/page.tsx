import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DeleteFormButton } from "@/components/features/forms/delete-form-button";
import { ArrowLeft } from "lucide-react";
import type { DynamicForm } from "@/types";

export default async function FormTemplatesPage() {
  const db = createServerClient();
  const { data: templates } = await db
    .from("dynamic_forms")
    .select("*")
    .eq("is_template", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link href="/admin/forms" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Forms
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Form Templates</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {templates?.length ?? 0} templates available for reuse
            </p>
          </div>
          <Link href="/admin/forms/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Template
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {(templates ?? []).length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No templates saved yet. Create a form and select &quot;Template&quot; type to save one.
            </p>
          )}
          {(templates ?? []).map((template: DynamicForm) => (
            <div
              key={template.id}
              className="flex items-center justify-between"
              style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F", margin: 0 }}>{template.title}</h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: template.status === "active" ? "#2A5E3A" : "#9B9188",
                      background: template.status === "active" ? "rgba(42,94,58,0.08)" : "rgba(90,82,71,0.08)",
                      textTransform: "capitalize",
                    }}
                  >
                    {template.status}
                  </span>
                </div>
                <div className="flex gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                  <span>{template.fields?.length ?? 0} fields</span>
                  <span style={{ color: "#9B9188", fontSize: 11 }}>Default target: {template.target_role}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/forms/${template.id}/edit`}>
                  <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                    Edit
                  </button>
                </Link>
                <DeleteFormButton formId={template.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
