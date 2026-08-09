"use client";

import { useForm, type UseFormRegister, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import type { DynamicForm, FormField } from "@/types";
import { submitForm } from "@/actions/forms";
import { uploadFileToStorage } from "@/actions/upload";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1.5px solid var(--border)",
  borderRadius: 7,
  background: "white",
  color: "var(--foreground)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--gs-text-secondary)",
  display: "block",
  marginBottom: 5,
  letterSpacing: "0.03em",
};

function FileImageInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadFileToStorage(fd, "media", `forms/${field.id}`);
      onChange(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "upload" ? "var(--gs-accent)" : "var(--gs-text-secondary)", fontWeight: 600 }}>
          <input type="radio" checked={mode === "upload"} onChange={() => setMode("upload")} style={{ accentColor: "var(--gs-accent)" }} />
          Upload File
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "link" ? "var(--gs-accent)" : "var(--gs-text-secondary)", fontWeight: 600 }}>
          <input type="radio" checked={mode === "link"} onChange={() => setMode("link")} style={{ accentColor: "var(--gs-accent)" }} />
          Direct Link
        </label>
      </div>

      {mode === "upload" ? (
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={field.accept ?? (field.type === "image" ? "image/*" : undefined)}
            onChange={handleFileChange}
            style={{ ...inputStyle, padding: "7px 12px", flex: 1 }}
          />
          {uploading && <span className="text-xs text-[var(--gs-muted)] self-center">Uploading...</span>}
        </div>
      ) : (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/file.pdf"
          style={inputStyle}
        />
      )}

      {value && (
        <p style={{ fontSize: 11, color: "var(--gs-success)", margin: "4px 0 0" }}>
          ✓ Selected: <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gs-accent)", textDecoration: "underline" }}>View File</a>
        </p>
      )}
      {error && <p style={{ fontSize: 11, color: "var(--gs-danger-alt)", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

function FieldRenderer({
  field,
  register,
  value,
  onChange,
}: {
  field: FormField;
  register: UseFormRegister<FieldValues>;
  value: string;
  onChange: (url: string) => void;
}) {
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
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "var(--foreground)" }}>
              <input type="radio" {...register(field.id)} value={o} style={{ accentColor: "var(--gs-accent)" }} />
              {o}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "var(--foreground)" }}>
              <input type="checkbox" {...register(field.id)} value={o} style={{ accentColor: "var(--gs-accent)" }} />
              {o}
            </label>
          ))}
        </div>
      );

    case "file":
    case "image":
      return <FileImageInput field={field} value={value} onChange={onChange} />;

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
  const { register, handleSubmit, setValue, watch } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.fields.forEach((field) => {
      if (field.type === "file" || field.type === "image") {
        register(field.id, { required: field.required });
      }
    });
  }, [form.fields, register]);

  async function onSubmit(data: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      await submitForm({ form_id: form.id, data });
      setSubmitted(true);
      toast.success("Form submitted successfully");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Submission failed";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Card>
<CardContent>
        <div style={{ fontSize: 32, color: "var(--gs-success)", marginBottom: 10 }}>✓</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>Submitted</h3>
        <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>Your response has been recorded.</p>
      </CardContent>
</Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
<CardContent>
        <div className="space-y-5">
          {form.fields.map((field) => (
            <div key={field.id}>
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: "var(--gs-danger-alt)", marginLeft: 3 }}>*</span>}
              </label>
              <FieldRenderer
                field={field}
                register={register}
                // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is inherently non-memoizable
                value={watch(field.id)}
                onChange={(url) => setValue(field.id, url, { shouldValidate: true })}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg px-4 py-3" style={{ background: "rgba(var(--gs-danger-alt-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-alt-rgb), 0.2)", fontSize: 13, color: "var(--gs-danger-alt)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: 20, width: "100%", background: saving ? "#C8C4BC" : "var(--foreground)", color: "white", fontSize: 14, fontWeight: 600, padding: "11px 0", borderRadius: 7, border: "none", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Submitting..." : "Submit"}
        </button>
      </CardContent>
</Card>
    </form>
  );
}
