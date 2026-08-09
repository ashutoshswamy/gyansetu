"use client";

import { useForm, type UseFormRegister, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import type { DynamicForm, FormField } from "@/types";
import { submitForm } from "@/actions/forms";
import { uploadFileToStorage } from "@/actions/upload";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as "upload" | "link")} className="flex gap-4 mb-2">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "upload" ? "var(--gs-accent)" : "var(--gs-text-secondary)", fontWeight: 600 }}>
          <RadioGroupItem value="upload" />
          Upload File
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "link" ? "var(--gs-accent)" : "var(--gs-text-secondary)", fontWeight: 600 }}>
          <RadioGroupItem value="link" />
          Direct Link
        </label>
      </RadioGroup>

      {mode === "upload" ? (
        <div className="flex gap-2">
          <Input
            ref={fileRef}
            type="file"
            accept={field.accept ?? (field.type === "image" ? "image/*" : undefined)}
            onChange={handleFileChange}
            className="flex-1"
          />
          {uploading && <span className="text-xs text-[var(--gs-muted)] self-center">Uploading...</span>}
        </div>
      ) : (
        <Input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/file.pdf"
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
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          {...register(field.id)}
          placeholder={field.placeholder}
          rows={4}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          {...register(field.id, { valueAsNumber: true })}
          placeholder={field.placeholder}
        />
      );

    case "date":
      return <Input type="date" {...register(field.id)} />;

    case "select":
      return (
        <Select value={(value as string) || undefined} onValueChange={v => onChange(v ?? "")}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return (
        <RadioGroup value={(value as string) || undefined} onValueChange={onChange} className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "var(--foreground)" }}>
              <RadioGroupItem value={o} />
              {o}
            </label>
          ))}
        </RadioGroup>
      );

    case "checkbox": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "var(--foreground)" }}>
              <Checkbox
                checked={selected.includes(o)}
                onCheckedChange={(checked) => {
                  onChange(checked ? [...selected, o] : selected.filter((v) => v !== o));
                }}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }

    case "file":
    case "image":
      return <FileImageInput field={field} value={(value as string) ?? ""} onChange={onChange} />;

    default:
      return (
        <Input
          {...register(field.id)}
          placeholder={field.placeholder}
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
      if (["file", "image", "select", "radio", "checkbox"].includes(field.type)) {
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
                onChange={(v) => setValue(field.id, v, { shouldValidate: true })}
              />
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full mt-5">
          {saving ? "Submitting..." : "Submit"}
        </Button>
      </CardContent>
</Card>
    </form>
  );
}
