"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm } from "@/actions/forms";

type Tour = { id: string; title: string };
type FieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "radio" | "date" | "file" | "image";

interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  accept?: string;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
  { value: "image", label: "Image Upload" },
];

const NEEDS_OPTIONS: FieldType[] = ["select", "radio", "checkbox"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function blankField(): Field {
  return { id: uid(), type: "text", label: "", placeholder: "", required: false, options: [] };
}

export function NewFormBuilder({ tours }: { tours: Tour[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tourId, setTourId] = useState("");
  const [targetRole, setTargetRole] = useState<"enrollment_user" | "volunteer" | "all">("enrollment_user");
  const [status, setStatus] = useState<"draft" | "active" | "closed">("draft");
  const [fields, setFields] = useState<Field[]>([blankField()]);

  function updateField(idx: number, patch: Partial<Field>) {
    setFields(fs => fs.map((f, i) => i === idx ? { ...f, ...patch } : f));
  }

  function removeField(idx: number) {
    setFields(fs => fs.filter((_, i) => i !== idx));
  }

  function addField() {
    setFields(fs => [...fs, blankField()]);
  }

  function updateOption(fIdx: number, oIdx: number, val: string) {
    setFields(fs => fs.map((f, i) => {
      if (i !== fIdx) return f;
      const opts = [...f.options];
      opts[oIdx] = val;
      return { ...f, options: opts };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createForm({
        title,
        description: description || undefined,
        tour_id: tourId || undefined,
        target_role: targetRole,
        status,
        fields: fields.map(f => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder || undefined,
          required: f.required || undefined,
          options: NEEDS_OPTIONS.includes(f.type) ? f.options.filter(Boolean) : undefined,
          accept: (f.type === "file" || f.type === "image") ? f.accept || undefined : undefined,
        })),
      });
      router.push("/admin/forms");
    } catch (err: any) {
      setError(err.message ?? "Failed to create form");
      setSaving(false);
    }
  }

  const inputStyle = { fontSize: 13, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#19140F", width: "100%", outline: "none" };
  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9B9188", display: "block", marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit}>
      {/* Meta */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9B9188", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Form Details</p>
        <div className="space-y-3">
          <div>
            <label style={labelStyle}>Title *</label>
            <input required style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Form title" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 56 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Linked Tour</label>
              <select style={inputStyle} value={tourId} onChange={e => setTourId(e.target.value)}>
                <option value="">No tour</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Role *</label>
              <select required style={inputStyle} value={targetRole} onChange={e => setTargetRole(e.target.value as any)}>
                <option value="enrollment_user">Students</option>
                <option value="volunteer">Volunteers</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-4">
        {fields.map((f, fIdx) => (
          <div key={f.id} className="rounded-xl p-5" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4A55BE", letterSpacing: "0.08em" }}>Field {fIdx + 1}</span>
              {fields.length > 1 && (
                <button type="button" onClick={() => removeField(fIdx)} style={{ fontSize: 11, color: "#B8381E", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Remove
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Label *</label>
                  <input required style={inputStyle} value={f.label} onChange={e => updateField(fIdx, { label: e.target.value })} placeholder="Field label" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={f.type} onChange={e => updateField(fIdx, { type: e.target.value as FieldType, options: [] })}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {!["file", "image", "checkbox", "date"].includes(f.type) && (
                <div>
                  <label style={labelStyle}>Placeholder</label>
                  <input style={inputStyle} value={f.placeholder ?? ""} onChange={e => updateField(fIdx, { placeholder: e.target.value })} placeholder="Placeholder text" />
                </div>
              )}

              {(f.type === "file" || f.type === "image") && (
                <div>
                  <label style={labelStyle}>Accepted Types</label>
                  <input style={inputStyle} value={f.accept ?? ""} onChange={e => updateField(fIdx, { accept: e.target.value })} placeholder={f.type === "image" ? "image/*" : ".pdf,.doc,.docx"} />
                </div>
              )}

              {NEEDS_OPTIONS.includes(f.type) && (
                <div>
                  <label style={labelStyle}>Options</label>
                  <div className="space-y-2">
                    {(f.options.length === 0 ? [""] : f.options).map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2">
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          value={opt}
                          onChange={e => updateOption(fIdx, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                        />
                        {f.options.length > 1 && (
                          <button type="button" onClick={() => updateField(fIdx, { options: f.options.filter((_, oi) => oi !== oIdx) })} style={{ fontSize: 11, color: "#B8381E", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => updateField(fIdx, { options: [...f.options, ""] })} style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      + Add option
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={f.required} onChange={e => updateField(fIdx, { required: e.target.checked })} />
                <span style={{ fontSize: 12, color: "#5A5247" }}>Required field</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addField} style={{ fontSize: 13, color: "#4A55BE", background: "rgba(74,85,190,0.07)", border: "1.5px dashed rgba(74,85,190,0.3)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", width: "100%", marginBottom: 16 }}>
        + Add Field
      </button>

      {error && <p style={{ fontSize: 13, color: "#B8381E", marginBottom: 12 }}>{error}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} style={{ fontSize: 13, padding: "9px 18px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ fontSize: 13, fontWeight: 600, padding: "9px 22px", borderRadius: 6, border: "none", background: saving ? "#C8C4BC" : "#19140F", color: "white", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Creating..." : "Create Form"}
        </button>
      </div>
    </form>
  );
}
