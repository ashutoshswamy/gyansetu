"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORM_TEMPLATES, PHASE_LABELS } from "@/lib/form-templates";
import { createForm } from "@/actions/forms";
import { FileText, Check } from "lucide-react";

const phaseColors: Record<string, { color: string; bg: string }> = {
  "pre-visit":    { color: "#1B3457", bg: "rgba(27,52,87,0.08)" },
  "during-visit": { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  "post-visit":   { color: "#A8641C", bg: "rgba(168,100,28,0.08)" },
  "network":      { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
};

export default function FormTemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [created, setCreated] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const byPhase = FORM_TEMPLATES.reduce((acc, t) => {
    if (!acc[t.phase]) acc[t.phase] = [];
    acc[t.phase].push(t);
    return acc;
  }, {} as Record<string, typeof FORM_TEMPLATES>);

  async function handleImport(template: typeof FORM_TEMPLATES[0]) {
    setLoading(template.id);
    setError(null);
    try {
      await createForm({
        title: template.title,
        description: template.description,
        fields: template.fields,
        target_role: template.target_role,
        status: "draft",
      });
      setCreated(prev => new Set([...prev, template.id]));
    } catch (err: any) {
      setError(`Failed to import "${template.title}": ${err.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console · Forms</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Form Templates</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {FORM_TEMPLATES.length} pre-built Gyan Setu SOP forms import as drafts, then activate when ready
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/forms")}
            style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}
          >
            ← Back to Forms
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
            {error}
          </div>
        )}

        {(Object.entries(byPhase) as [string, typeof FORM_TEMPLATES][]).map(([phase, templates]) => {
          const c = phaseColors[phase] ?? phaseColors["pre-visit"];
          return (
            <div key={phase} className="mb-8">
              <h2 style={{ fontSize: 13, fontWeight: 600, color: c.color, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {PHASE_LABELS[phase as keyof typeof PHASE_LABELS]} ({templates.length} forms)
              </h2>
              <div className="space-y-2">
                {templates.map(t => {
                  const isLoading = loading === t.id;
                  const isDone = created.has(t.id);
                  return (
                    <div key={t.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={16} style={{ color: c.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{t.title}</span>
                          <span style={{ fontSize: 11, color: c.color, background: c.bg, padding: "1px 6px", borderRadius: 4, fontWeight: 600, textTransform: "capitalize" }}>
                            {t.target_role}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                          {t.description} · {t.fields.length} fields
                        </p>
                      </div>
                      <button
                        onClick={() => handleImport(t)}
                        disabled={isLoading || isDone}
                        style={{
                          background: isDone ? "rgba(42,94,58,0.08)" : c.bg,
                          color: isDone ? "#2A5E3A" : c.color,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 14px",
                          borderRadius: 5,
                          border: `1.5px solid ${isDone ? "rgba(42,94,58,0.2)" : "transparent"}`,
                          cursor: isLoading || isDone ? "not-allowed" : "pointer",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          opacity: isLoading ? 0.7 : 1,
                        }}
                      >
                        {isDone ? <><Check size={12} /> Imported</> : isLoading ? "Importing..." : "Import as Draft"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
