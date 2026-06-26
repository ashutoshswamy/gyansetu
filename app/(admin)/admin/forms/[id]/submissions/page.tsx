import { createServerClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/features/export-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import type { FormField } from "@/types";

export default async function FormSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: form, error: formError }, { data: submissions, error: subError }] = await Promise.all([
    db.from("dynamic_forms").select("*").eq("id", id).single(),
    db
      .from("form_submissions")
      .select("id, data, submitted_at, users(name, email)")
      .eq("form_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  if (formError || !form) notFound();

  const fields = (form.fields as FormField[]) ?? [];

  const exportData = (submissions ?? []).map((sub: any) => {
    const row: Record<string, any> = {
      "Submitter Name": sub.users?.name ?? "Unknown",
      "Submitter Email": sub.users?.email ?? "Unknown",
      "Submitted At": new Date(sub.submitted_at).toLocaleString(),
    };
    for (const field of fields) {
      const val = sub.data?.[field.id];
      row[field.label] = Array.isArray(val) ? val.join(", ") : (val ?? "");
    }
    return row;
  });

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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Submissions</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {form.title} &middot; {submissions?.length ?? 0} total submissions
            </p>
          </div>
          {submissions && submissions.length > 0 && (
            <ExportButton data={exportData} filename={`${form.title.toLowerCase().replace(/\s+/g, "-")}-submissions.csv`} />
          )}
        </div>

        {/* Submissions List */}
        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
          {(submissions ?? []).length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No submissions yet for this form.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3F0E8", borderBottom: "1px solid #E4DFD1" }}>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 150 }}>Submitter</th>
                    <th className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 160 }}>Submitted At</th>
                    {fields.map((f) => (
                      <th key={f.id} className="p-4 font-semibold text-[#5A5247]" style={{ minWidth: 150 }}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(submissions ?? []).map((sub: any) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid #E4DFD1" }} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-medium text-[#19140F]">{sub.users?.name ?? "Unknown"}</div>
                        <div className="text-xs text-[#9B9188]">{sub.users?.email ?? "Unknown"}</div>
                      </td>
                      <td className="p-4 text-[#5A5247]">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      {fields.map((field) => {
                        const val = sub.data?.[field.id];
                        let content = "";
                        if (Array.isArray(val)) {
                          content = val.join(", ");
                        } else if (typeof val === "boolean") {
                          content = val ? "Yes" : "No";
                        } else {
                          content = val !== undefined && val !== null ? String(val) : "-";
                        }
                        return (
                          <td key={field.id} className="p-4 text-[#19140F]">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
