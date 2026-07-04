import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DynamicForm } from "@/types";

export default async function VolunteerFormsPage() {
  const db = createServerClient();
  const { data: forms } = await db
    .from("dynamic_forms")
    .select("*")
    .in("target_role", ["volunteer", "all"])
    .eq("status", "active")
    .eq("is_template", false)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Forms</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Active forms assigned to volunteers</p>
        </div>

        <div className="space-y-3">
          {(forms ?? []).length === 0 && (
            <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "48px 0" }}>No active forms right now.</p>
          )}
          {(forms ?? []).map((form: DynamicForm) => (
            <div key={form.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 4px" }}>{form.title}</h3>
                {form.description && <p style={{ fontSize: 12, color: "#5A5247", margin: "0 0 4px" }}>{form.description}</p>}
                <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>{form.fields?.length ?? 0} fields</p>
              </div>
              <Link href={`/volunteer/forms/${form.id}`}>
                <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
                  Fill Form
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
