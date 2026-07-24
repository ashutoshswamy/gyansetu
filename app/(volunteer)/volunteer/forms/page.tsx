import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DynamicForm } from "@/types";

function FormCard({ form, status }: { form: DynamicForm; status: "submitted" | "draft" }) {
  const isSubmitted = status === "submitted";
  return (
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }}>{form.title}</h3>
          <span
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              padding: "2px 8px", borderRadius: 999,
              color: isSubmitted ? "#2A5E3A" : "#A8641C",
              background: isSubmitted ? "rgba(42,94,58,0.08)" : "rgba(168,100,28,0.08)",
            }}
          >
            {isSubmitted ? "Submitted" : "Draft"}
          </span>
        </div>
        {form.description && <p style={{ fontSize: 12, color: "#5A5247", margin: "0 0 4px" }}>{form.description}</p>}
        <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>{form.fields?.length ?? 0} fields</p>
      </div>
      <Link href={`/volunteer/forms/${form.id}`}>
        <button style={{ background: isSubmitted ? "white" : "#4A55BE", color: isSubmitted ? "#5A5247" : "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: isSubmitted ? "1px solid #E4DFD1" : "none", cursor: "pointer" }}>
          {isSubmitted ? "Open Form" : "Fill Form"}
        </button>
      </Link>
    </div>
  );
}

export default async function VolunteerFormsPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId!).single();
  const uid = user?.id ?? "";

  const { data: forms } = await db
    .from("dynamic_forms")
    .select("*")
    .in("target_role", ["volunteer", "all"])
    .eq("status", "active")
    .eq("is_template", false)
    .order("created_at", { ascending: false });

  const formIds = (forms ?? []).map((f) => f.id);
  const { data: submissions } = formIds.length
    ? await db.from("form_submissions").select("form_id").eq("submitted_by", uid).in("form_id", formIds)
    : { data: [] };

  const submittedIds = new Set((submissions ?? []).map((s) => s.form_id));
  const submittedForms = (forms ?? []).filter((f: DynamicForm) => submittedIds.has(f.id));
  const draftForms = (forms ?? []).filter((f: DynamicForm) => !submittedIds.has(f.id));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Forms</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Active forms assigned to volunteers</p>
        </div>

        {(forms ?? []).length === 0 && (
          <p style={{ fontSize: 14, color: "#9B9188", textAlign: "center", padding: "48px 0" }}>No active forms right now.</p>
        )}

        {draftForms.length > 0 && (
          <div className="mb-8">
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Draft ({draftForms.length})</h2>
            <div className="space-y-3">
              {draftForms.map((form: DynamicForm) => <FormCard key={form.id} form={form} status="draft" />)}
            </div>
          </div>
        )}

        {submittedForms.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Submitted ({submittedForms.length})</h2>
            <div className="space-y-3">
              {submittedForms.map((form: DynamicForm) => <FormCard key={form.id} form={form} status="submitted" />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
