"use client";

import { useForm } from "react-hook-form";
import type { DynamicForm, FormField } from "@/types";
import { submitForm } from "@/actions/forms";
import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1.5px solid #E4DFD1",
  borderRadius: 7,
  background: "white",
  color: "#19140F",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#5A5247",
  display: "block",
  marginBottom: 5,
  letterSpacing: "0.03em",
};

function FieldRenderer({ field, register }: { field: FormField; register: any }) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          {...register(field.id)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      );

    case "number":
      return (
        <input
          type="number"
          {...register(field.id, { valueAsNumber: true })}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      );

    case "date":
      return <input type="date" {...register(field.id)} style={inputStyle} />;

    case "select":
      return (
        <select {...register(field.id)} style={inputStyle}>
          <option value="">Select...</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#19140F" }}>
              <input type="radio" {...register(field.id)} value={o} style={{ accentColor: "#4A55BE" }} />
              {o}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#19140F" }}>
              <input type="checkbox" {...register(field.id)} value={o} style={{ accentColor: "#4A55BE" }} />
              {o}
            </label>
          ))}
        </div>
      );

    case "file":
    case "image":
      return (
        <input
          type="file"
          {...register(field.id)}
          accept={field.accept ?? (field.type === "image" ? "image/*" : undefined)}
          style={{ ...inputStyle, padding: "7px 12px" }}
        />
      );

    default:
      return (
        <input
          {...register(field.id)}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      );
  }
}

export function DynamicFormRenderer({ form }: { form: DynamicForm }) {
  const { register, handleSubmit } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(data: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      await submitForm({ form_id: form.id, data });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl text-center py-14" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <div style={{ fontSize: 32, color: "#2A5E3A", marginBottom: 10 }}>✓</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#19140F", marginBottom: 6 }}>Submitted</h3>
        <p style={{ fontSize: 14, color: "#9B9188" }}>Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl p-6" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <div className="space-y-5">
          {form.fields.map((field) => (
            <div key={field.id}>
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: "#B8381E", marginLeft: 3 }}>*</span>}
              </label>
              <FieldRenderer field={field} register={register} />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg px-4 py-3" style={{ background: "rgba(184,56,30,0.07)", border: "1px solid rgba(184,56,30,0.2)", fontSize: 13, color: "#B8381E" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: 20, width: "100%", background: saving ? "#C8C4BC" : "#19140F", color: "white", fontSize: 14, fontWeight: 600, padding: "11px 0", borderRadius: 7, border: "none", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
