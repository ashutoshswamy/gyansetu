"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createForm, updateForm } from "@/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  category?: "general" | "task" | "survey" | "cultural_activity";
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
  const [tourIds, setTourIds] = useState<string[]>(initialData?.tour_id ? [initialData.tour_id] : []);
  const [targetRole, setTargetRole] = useState<"enrollee" | "volunteer" | "all">(initialData?.target_role ?? "enrollee");
  const [category, setCategory] = useState<"general" | "task" | "survey" | "cultural_activity">(initialData?.category ?? "general");
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

  function applyTemplate(tId: string) {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title,
      description: description || undefined,
      tour_id: isTemplate ? null : (tourIds[0] || null),
      target_role: targetRole,
      status,
      category,
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
        await createForm(payload, isTemplate ? undefined : tourIds);
      }
      toast.success(isEdit ? "Form updated successfully" : "Form created successfully");
      if (isTemplate) {
        router.push("/admin/forms/templates");
      } else {
        router.push("/admin/forms");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save form";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Template Importer */}
      {!isEdit && templates.length > 0 && (
        <div className="rounded-xl p-5 mb-4 border-[1.5px] border-dashed border-[#4A55BE] bg-white text-[#4A55BE]">
          <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#4A55BE]">
            Import from existing Template
          </Label>
          <div className="flex gap-3 items-center mt-1">
            <Select value="" onValueChange={(v: string | null) => applyTemplate(v ?? "")}>
              <SelectTrigger className="w-full border-[#4A55BE]/30">
                <SelectValue placeholder="Select a template to import..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} ({t.fields?.length ?? 0} fields)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-1.5 text-[11px] text-[#9B9188]">
            * Selecting a template will overwrite the title, description, and fields in the builder below.
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl p-5 mb-4 border border-[#E4DFD1] bg-white">
        <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Form Details</p>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Title *</Label>
            <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Form title" />
          </div>
          <div>
            <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Form Type *</Label>
              <Select
                value={isTemplate ? "template" : "link"}
                onValueChange={(v: string | null) => {
                  const val = v === "template";
                  setIsTemplate(val);
                  if (val) {
                    setTourIds([]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Standard Form</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">
                {isEdit ? "Linked Tour" : "Linked Tour(s)"}
              </Label>
              {isEdit ? (
                <Select
                  disabled={isTemplate}
                  value={tourIds[0] ?? ""}
                  onValueChange={(v: string | null) => setTourIds(v ? [v] : [])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div
                  className="flex max-h-[140px] flex-col gap-px overflow-y-auto rounded-md border-[1.5px] border-[#E4DFD1] bg-white p-1.5"
                  style={{ opacity: isTemplate ? 0.5 : 1, pointerEvents: isTemplate ? "none" : "auto" }}
                >
                  {tours.length === 0 && (
                    <span className="px-1.5 py-1.5 text-[12.5px] text-[#9B9188]">No tours available</span>
                  )}
                  {tours.map(t => {
                    const checked = tourIds.includes(t.id);
                    return (
                      <Label
                        key={t.id}
                        className={`cursor-pointer gap-2 rounded px-1.5 py-1.5 text-sm text-[#19140F] ${checked ? "bg-[#4A55BE]/[0.07]" : ""}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => setTourIds(checked ? tourIds.filter(id => id !== t.id) : [...tourIds, t.id])}
                        />
                        {t.title}
                      </Label>
                    );
                  })}
                </div>
              )}
              {!isTemplate && (
                <p className="mt-1 text-[11px] text-[#9B9188]">
                  {isEdit
                    ? "Assigning a tour makes this visible to every group in that tour."
                    : "Check multiple tours to create one linked copy per tour, each visible to every group in that tour. Leave unchecked for no tour."}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Target Role *</Label>
              <Select value={targetRole} onValueChange={(v: string | null) => setTargetRole((v ?? "enrollee") as "enrollee" | "volunteer" | "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrollee">Enrollees</SelectItem>
                  <SelectItem value="volunteer">Volunteers</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Status</Label>
              <Select value={status} onValueChange={(v: string | null) => setStatus((v ?? "draft") as "draft" | "active" | "closed")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Category</Label>
              <Select value={category} onValueChange={(v: string | null) => setCategory((v ?? "general") as "general" | "task" | "survey" | "cultural_activity")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="task">Task Assignment / PPT Submission</SelectItem>
                  <SelectItem value="survey">Survey / Interesting Facts</SelectItem>
                  <SelectItem value="cultural_activity">Cultural Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-4">
        {fields.map((f, fIdx) => (
          <div key={f.id} className="rounded-xl p-5 border border-[#E4DFD1] bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#4A55BE]">Field {fIdx + 1}</span>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => removeField(fIdx)}
                  className="h-auto p-0 text-[11px] text-[#B8381E]"
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Label *</Label>
                  <Input required value={f.label} onChange={e => updateField(fIdx, { label: e.target.value })} placeholder="Field label" />
                </div>
                <div>
                  <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Type</Label>
                  <Select value={f.type} onValueChange={(v: string | null) => updateField(fIdx, { type: (v ?? "text") as FieldType, options: [] })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!["file", "image", "checkbox", "date"].includes(f.type) && (
                <div>
                  <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Placeholder</Label>
                  <Input value={f.placeholder ?? ""} onChange={e => updateField(fIdx, { placeholder: e.target.value })} placeholder="Placeholder text" />
                </div>
              )}

              {(f.type === "file" || f.type === "image") && (
                <div>
                  <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Accepted Types</Label>
                  <Input value={f.accept ?? ""} onChange={e => updateField(fIdx, { accept: e.target.value })} placeholder={f.type === "image" ? "image/*" : ".pdf,.doc,.docx"} />
                </div>
              )}

              {NEEDS_OPTIONS.includes(f.type) && (
                <div>
                  <Label className="mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9B9188]">Options</Label>
                  <div className="space-y-2">
                    {(f.options.length === 0 ? [""] : f.options).map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={opt}
                          onChange={e => updateOption(fIdx, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                        />
                        {f.options.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateField(fIdx, { options: f.options.filter((_, oi) => oi !== oIdx) })}
                            className="text-[11px] text-[#B8381E]"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      onClick={() => updateField(fIdx, { options: [...f.options, ""] })}
                      className="h-auto p-0 text-xs text-[#4A55BE]"
                    >
                      + Add option
                    </Button>
                  </div>
                </div>
              )}

              <Label className="cursor-pointer">
                <Checkbox checked={f.required} onCheckedChange={(checked) => updateField(fIdx, { required: checked === true })} />
                <span className="text-xs text-[#5A5247]">Required field</span>
              </Label>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addField}
        className="mb-4 w-full border-[1.5px] border-dashed border-[#4A55BE]/30 bg-[#4A55BE]/[0.07] text-[#4A55BE] hover:bg-[#4A55BE]/[0.12]"
      >
        + Add Field
      </Button>

      {error && <p className="mb-3 text-sm text-[#B8381E]">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/forms")}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#19140F] text-white hover:bg-[#19140F]/85">
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Form"}
        </Button>
      </div>
    </form>
  );
}
