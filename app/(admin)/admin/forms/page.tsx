import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DeleteFormButton } from "@/components/features/forms/delete-form-button";
import type { DynamicForm } from "@/types";

export default async function AdminFormsPage() {
  const db = createServerClient();
  const { data: forms } = await db
    .from("dynamic_forms")
    .select("*")
    .eq("is_template", false)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Forms</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {forms?.length ?? 0} forms total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/forms/templates">
              <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                Form Templates
              </button>
            </Link>
            <Link href="/admin/forms/new">
              <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
                + New Form
              </button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {(forms ?? []).length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No forms yet.
            </p>
          )}
          {(forms ?? []).map((form: DynamicForm) => (
            <div
              key={form.id}
              className="flex items-center justify-between"
              style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F", margin: 0 }}>{form.title}</h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: form.status === "active" ? "#2A5E3A" : "#9B9188",
                      background: form.status === "active" ? "rgba(42,94,58,0.08)" : "rgba(90,82,71,0.08)",
                      textTransform: "capitalize",
                    }}
                  >
                    {form.status}
                  </span>
                </div>
                <div className="flex gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                  <span>{form.fields?.length ?? 0} fields</span>
                  <span style={{ color: "#9B9188", fontSize: 11 }}>For: {form.target_role}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/forms/${form.id}/submissions`}>
                  <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                    Submissions
                  </button>
                </Link>
                <Link href={`/admin/forms/${form.id}/edit`}>
                  <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                    Edit
                  </button>
                </Link>
                <DeleteFormButton formId={form.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
