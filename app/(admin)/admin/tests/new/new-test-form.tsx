"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTest, updateTest } from "@/actions/tests";
import type { EligibilityTest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tour = { id: string; title: string };
type QuestionType = "mcq" | "multi_select" | "subjective";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string | string[];
  marks: number;
}

interface InitialData {
  id: string;
  title: string;
  description?: string;
  tour_id?: string;
  duration_minutes: number;
  passing_score: number;
  status: "draft" | "active" | "closed";
  is_template: boolean;
  questions: Question[];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function blankQuestion(): Question {
  return { id: uid(), type: "mcq", question: "", options: ["", ""], correct_answer: "", marks: 1 };
}

export function NewTestForm({ tours, templates = [], initialData }: { tours: Tour[]; templates?: EligibilityTest[]; initialData?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [tourIds, setTourIds] = useState<string[]>(initialData?.tour_id ? [initialData.tour_id] : []);
  const [duration, setDuration] = useState(initialData?.duration_minutes ?? 30);
  const [passing, setPassing] = useState(initialData?.passing_score ?? 60);
  const [status, setStatus] = useState<"draft" | "active" | "closed">(initialData?.status ?? "draft");
  const [isTemplate, setIsTemplate] = useState(initialData?.is_template ?? false);
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions ?? [blankQuestion()]);

  function updateQ(idx: number, patch: Partial<Question>) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }

  function addQ() {
    setQuestions(qs => [...qs, blankQuestion()]);
  }

  function removeQ(idx: number) {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  function updateOption(qIdx: number, oIdx: number, val: string) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    }));
  }

  function addOption(qIdx: number) {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ""] } : q));
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = q.options.filter((_, oi) => oi !== oIdx);
      return { ...q, options: opts };
    }));
  }

  function importTemplate(templateId: string) {
    const selected = templates.find(t => t.id === templateId);
    if (!selected) return;
    setTitle(selected.title);
    setDescription(selected.description ?? "");
    setDuration(selected.duration_minutes);
    setPassing(selected.passing_score);
    setStatus(selected.status);
    setIsTemplate(false);
    setQuestions(selected.questions.map(q => ({
      id: uid(),
      type: q.type as QuestionType,
      question: q.question,
      options: q.options ? [...q.options] : ["", ""],
      correct_answer: q.correct_answer ?? "",
      marks: q.marks ?? 1,
    })));
    toast.success(`Imported template: ${selected.title}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!isTemplate && tourIds.length === 0) {
      setError("Please select at least one linked tour");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEdit && initialData) {
        await updateTest(initialData.id, {
          title,
          description,
          tour_id: tourIds[0] ?? undefined,
          duration_minutes: duration,
          passing_score: passing,
          status,
          is_template: isTemplate,
          questions,
        });
        toast.success("Test updated successfully");
        router.push(`/admin/tests/${initialData.id}`);
      } else {
        await createTest(
          {
            title,
            description,
            duration_minutes: duration,
            passing_score: passing,
            status,
            is_template: isTemplate,
            questions,
          },
          isTemplate ? [] : tourIds
        );
        toast.success(isTemplate ? "Template created" : "Test(s) created successfully");
        router.push("/admin/tests");
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save test";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Template Importer */}
      {!isEdit && templates.length > 0 && (
        <div className="rounded-xl p-5 mb-4 bg-background border-1.5 border-dashed border-accent">
          <Label className="text-xs font-semibold text-accent uppercase tracking-wider block mb-2">Import from existing Template</Label>
          <div className="flex gap-3 items-center mt-1">
            <Select
              onValueChange={(val) => { if (typeof val === "string" && val) importTemplate(val); }}
              items={templates.map(t => ({ value: t.id, label: `${t.title} (${t.questions?.length ?? 0} questions)` }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template to import..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} ({t.questions?.length ?? 0} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 m-0">
            * Selecting a template will overwrite the details and questions in the builder below.
          </p>
        </div>
      )}

      {/* Meta */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">Test Details</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</Label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Test title" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea className="min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional instructions for students" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test Type *</Label>
                <Select
                  value={isTemplate ? "template" : "link"}
                  onValueChange={(val) => {
                    const isTemp = val === "template";
                    setIsTemplate(isTemp);
                    if (isTemp) setTourIds([]);
                  }}
                  items={[
                    { value: "link", label: "Standard Test" },
                    { value: "template", label: "Template" },
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Standard Test</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isEdit ? "Linked Tour" : "Linked Tour(s)"} {isTemplate ? "" : "*"}</Label>
                {isEdit ? (
                  <Select
                    disabled={isTemplate}
                    value={tourIds[0] ?? ""}
                    onValueChange={(val) => setTourIds(val ? [val] : [])}
                    items={tours.map(t => ({ value: t.id, label: t.title }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tours.length === 0 ? "No tours available" : "No tour"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={`p-2 border border-input rounded-md max-h-35 overflow-y-auto flex flex-col gap-1 ${isTemplate ? "opacity-50 pointer-events-none" : ""}`}>
                    {tours.length === 0 && (
                      <span className="text-xs text-muted-foreground p-1.5">No tours available</span>
                    )}
                    {tours.map(t => {
                      const checked = tourIds.includes(t.id);
                      return (
                        <Label
                          key={t.id}
                          className="flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs hover:bg-accent/10"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => setTourIds(c ? [...tourIds, t.id] : tourIds.filter(id => id !== t.id))}
                          />
                          {t.title}
                        </Label>
                      );
                    })}
                  </div>
                )}
                {!isTemplate && (
                  <p className="text-[11px] text-muted-foreground mt-1 m-0">
                    {isEdit
                      ? "Assigning a tour makes this visible to every group in that tour."
                      : "Check multiple tours to create one linked copy per tour, each visible to every group in that tour."}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration (minutes) *</Label>
                <Input required type="number" min={1} placeholder="Enter duration (minutes)" value={duration} onChange={e => setDuration(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passing Score (%) *</Label>
                <Input required type="number" min={0} max={100} placeholder="Enter passing marks" value={passing} onChange={e => setPassing(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as "draft" | "active" | "closed")}
                  items={[
                    { value: "draft", label: "Draft" },
                    { value: "active", label: "Active" },
                    { value: "closed", label: "Closed" },
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((q, qIdx) => (
          <Card key={q.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-accent tracking-wider">Q{qIdx + 1}</span>
                {questions.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQ(qIdx)} className="h-auto p-0 text-xs text-destructive hover:text-destructive">
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question * (min 5 characters)</Label>
                    <Input required minLength={5} value={q.question} onChange={e => updateQ(qIdx, { question: e.target.value })} placeholder="Question text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val) => updateQ(qIdx, { type: val as QuestionType, correct_answer: "", options: ["", ""] })}
                      items={[
                        { value: "mcq", label: "MCQ" },
                        { value: "multi_select", label: "Multi Select" },
                        { value: "subjective", label: "Subjective" },
                      ]}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="multi_select">Multi Select</SelectItem>
                        <SelectItem value="subjective">Subjective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marks</Label>
                  <Input type="number" min={1} placeholder="Marks" className="w-20" value={q.marks} onChange={e => updateQ(qIdx, { marks: Number(e.target.value) })} />
                </div>

                {q.type !== "subjective" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options</Label>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input
                            type={q.type === "multi_select" ? "checkbox" : "radio"}
                            name={`correct-${q.id}`}
                            checked={q.type === "multi_select"
                              ? (Array.isArray(q.correct_answer) ? q.correct_answer : []).includes(opt) && opt !== ""
                              : q.correct_answer === opt && opt !== ""}
                            onChange={() => {
                              if (q.type === "multi_select") {
                                const curr = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                const next = curr.includes(opt) ? curr.filter(a => a !== opt) : [...curr, opt];
                                updateQ(qIdx, { correct_answer: next });
                              } else {
                                updateQ(qIdx, { correct_answer: opt });
                              }
                            }}
                            className="shrink-0"
                          />
                          <Input
                            className="flex-1"
                            value={opt}
                            onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                          />
                          {q.options.length > 2 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIdx, oIdx)} className="h-8 w-8 text-destructive hover:text-destructive shrink-0">✕</Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="link" size="sm" onClick={() => addOption(qIdx)} className="h-auto p-0 text-xs text-accent">
                        + Add option
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {q.type === "multi_select" ? "Check all correct answers." : "Select correct answer."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addQ} className="w-full mb-4 border-dashed border-accent text-accent hover:bg-accent/5">
        + Add Question
      </Button>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || (!isTemplate && tours.length === 0)}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Test"}
        </Button>
      </div>
    </form>
  );
}
