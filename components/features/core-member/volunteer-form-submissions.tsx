"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FormField, FormSubmission } from "@/types";

function fieldValue(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return val !== undefined && val !== null ? String(val) : "-";
}

type Submission = FormSubmission & { dynamic_forms: { title: string; fields?: FormField[] } | null };

export function VolunteerFormSubmissions({ submissions }: { submissions: Submission[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {submissions.map((s) => {
        const form = s.dynamic_forms;
        const fields = form?.fields ?? [];
        const open = openId === s.id;
        return (
          <div key={s.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : s.id)}
              disabled={fields.length === 0}
              className="flex items-center justify-between w-full"
              style={{ padding: "12px 16px", background: "none", border: "none", cursor: fields.length ? "pointer" : "default", textAlign: "left" }}
            >
              <div className="flex items-center gap-2">
                {fields.length > 0 ? (open ? <ChevronDown size={14} style={{ color: "var(--gs-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--gs-muted)" }} />) : <span style={{ width: 14 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{form?.title ?? "Form"}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
            </button>

            {open && fields.length > 0 && (
              <div className="space-y-2" style={{ padding: "0 16px 14px" }}>
                {fields.map((field) => (
                  <div key={field.id}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>{field.label}</p>
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{fieldValue(s.data?.[field.id])}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
