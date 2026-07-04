"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm, updateForm } from "@/actions/forms";
import type { DynamicForm, FormField } from "@/types";

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

interface InitialData {
  id: string;
  title: string;
  description?: string;
  tour_id?: string;
  target_role: "enrollee" | "volunteer" | "all";
  status: "draft" | "active" | "closed";
  is_template: boolean;
  fields: Field[];
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

export function NewFormBuilder({ tours, templates = [], initialData }: { tours: Tour[]; templates?: DynamicForm[]; initialData?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [tourId, setTourId] = useState(initialData?.tour_id ?? "");
  const [targetRole, setTargetRole] = useState<"enrollee" | "volunteer" | "all">(initialData?.target_role ?? "enrollee");
  const [status, setStatus] = useState<"draft" | "active" | "closed">(initialData?.status ?? "draft");
  const [isTemplate, setIsTemplate] = useState(initialData?.is_template ?? false);
  const [fields, setFields] = useState<Field[]>(initialData?.fields ?? [blankField()]);

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
    const payload = {
      title,
      description: description || undefined,
      tour_id: isTemplate ? null : (tourId || null),
      target_role: targetRole,
      status,
      is_template: isTemplate,
      fields: fields.map(f => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder || undefined,
        required: f.required || undefined,
        options: NEEDS_OPTIONS.includes(f.type) ? f.options.filter(Boolean) : undefined,
        accept: (f.type === "file" || f.type === "image") ? f.accept || undefined : undefined,
      })),
    };
    try {
      if (isEdit) {
        await updateForm(initialData.id, payload);
      } else {
        await createForm(payload);
      }
      if (isTemplate) {
        router.push("/admin/forms/templates");
      } else {
        router.push("/admin/forms");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save form");
      setSaving(false);
    }
  }

  const inputStyle = { fontSize: 13, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#19140F", width: "100%", outline: "none" };
  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9B9188", display: "block", marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit}>
      {/* Template Importer */}
      {!isEdit && templates.length > 0 && (
        <div className="rounded-xl p-5 mb-4" style={{ background: "white", border: "1.5px dashed #4A55BE", color: "#4A55BE" }}>
          <label style={{ ...labelStyle, color: "#4A55BE" }}>Import from existing Template</label>
          <div className="flex gap-3 items-center mt-1">
            <select
              style={{ ...inputStyle, borderColor: "rgba(74,85,190,0.3)" }}
              defaultValue=""
              onChange={e => {
                const tId = e.target.value;
                if (!tId) return;
                const selected = templates.find(t => t.id === tId);
                if (selected) {
                  setTitle(selected.title);
                  setDescription(selected.description ?? "");
                  setTargetRole(selected.target_role as "enrollee" | "volunteer" | "all");
                  setStatus(selected.status);
                  setIsTemplate(false); // Default to saving as new linked form
                  setFields(selected.fields.map((f: FormField) => ({
                    id: uid(),
                    type: f.type,
                    label: f.label,
                    placeholder: f.placeholder ?? "",
                    required: !!f.required,
                    options: f.options ?? [],
                    accept: f.accept ?? "",
                  })));
                }
              }}
            >
              <option value="">Select a template to import...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.fields?.length ?? 0} fields)
                </option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: 11, color: "#9B9188", marginTop: 6, margin: "6px 0 0 0" }}>
            * Selecting a template will overwrite the title, description, and fields in the builder below.
          </p>
        </div>
      )}

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
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label style={labelStyle}>Form Type *</label>
              <select style={inputStyle} value={isTemplate ? "template" : "link"} onChange={e => {
                const val = e.target.value === "template";
                setIsTemplate(val);
                if (val) {
                  setTourId("");
                }
              }}>
                <option value="link">Standard Form</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Linked Tour</label>
              <select disabled={isTemplate} style={{ ...inputStyle, opacity: isTemplate ? 0.5 : 1 }} value={tourId} onChange={e => setTourId(e.target.value)}>
                <option value="">No tour</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Role *</label>
              <select required style={inputStyle} value={targetRole} onChange={e => setTargetRole(e.target.value as "enrollee" | "volunteer" | "all")}>
                <option value="enrollee">Enrollees</option>
                <option value="volunteer">Volunteers</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as "draft" | "active" | "closed")}>
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
        <button type="button" onClick={() => router.push("/admin/forms")} style={{ fontSize: 13, padding: "9px 18px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ fontSize: 13, fontWeight: 600, padding: "9px 22px", borderRadius: 6, border: "none", background: saving ? "#C8C4BC" : "#19140F", color: "white", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Form"}
        </button>
      </div>
    </form>
  );
}
