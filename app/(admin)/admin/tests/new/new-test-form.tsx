"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTest, updateTest } from "@/actions/tests";
import type { EligibilityTest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    setIsTemplate(false); // Default to saving as new linked test
    setQuestions(selected.questions.map(q => ({
      id: uid(),
      type: q.type,
      question: q.question,
      options: q.options ?? ["", ""],
      correct_answer: q.correct_answer ?? "",
      marks: q.marks,
    })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTemplate && tourIds.length === 0) {
      const msg = "Select at least one tour, or mark this as a Template.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (status === "active" && !isTemplate) {
      const ok = window.confirm(
        "Status is set to Active — this test will be immediately visible and available to every enrollee already applied to the linked tour. Continue?"
      );
      if (!ok) return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title,
      description: description || undefined,
      tour_id: isTemplate ? null : (tourIds[0] || null),
      duration_minutes: duration,
      passing_score: passing,
      questions: questions.map(q => ({
        ...q,
        options: q.type === "subjective" ? undefined : q.options.filter(Boolean),
        correct_answer: q.type === "subjective" ? undefined : q.correct_answer,
      })),
      status,
      is_template: isTemplate,
    };
    try {
      const result = isEdit
        ? await updateTest(initialData.id, payload)
        : await createTest(payload, isTemplate ? undefined : tourIds);

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        setSaving(false);
        return;
      }

      toast.success(isEdit ? "Test updated successfully" : "Test created successfully");
      router.push(isTemplate ? "/admin/tests/templates" : "/admin/tests");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save test";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  const inputStyle = { fontSize: 13, padding: "8px 12px", borderRadius: 6, border: "1.5px solid var(--border)", background: "white", color: "var(--foreground)", width: "100%", outline: "none" };
  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--gs-muted)", display: "block", marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit}>
      {/* Template Importer */}
      {!isEdit && templates.length > 0 && (
        <div className="rounded-xl p-5 mb-4" style={{ background: "white", border: "1.5px dashed var(--gs-accent)", color: "var(--gs-accent)" }}>
          <label style={{ ...labelStyle, color: "var(--gs-accent)" }}>Import from existing Template</label>
          <div className="flex gap-3 items-center mt-1">
            <select
              style={{ ...inputStyle, borderColor: "rgba(var(--gs-accent-rgb), 0.3)" }}
              defaultValue=""
              onChange={e => { if (e.target.value) importTemplate(e.target.value); }}
            >
              <option value="">Select a template to import...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.questions?.length ?? 0} questions)
                </option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 6, margin: "6px 0 0 0" }}>
            * Selecting a template will overwrite the details and questions in the builder below.
          </p>
        </div>
      )}

      {/* Meta */}
      <Card>
<CardContent>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-muted)", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Test Details</p>
        <div className="space-y-3">
          <div>
            <label style={labelStyle}>Title *</label>
            <input required style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Test title" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional instructions for students" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Test Type *</label>
              <select style={inputStyle} value={isTemplate ? "template" : "link"} onChange={e => {
                const val = e.target.value === "template";
                setIsTemplate(val);
                if (val) setTourIds([]);
              }}>
                <option value="link">Standard Test</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEdit ? "Linked Tour" : "Linked Tour(s)"} {isTemplate ? "" : "*"}</label>
              {isEdit ? (
                <select required={!isTemplate} disabled={isTemplate} style={{ ...inputStyle, opacity: isTemplate ? 0.5 : 1 }} value={tourIds[0] ?? ""} onChange={e => setTourIds(e.target.value ? [e.target.value] : [])}>
                  <option value="">{tours.length === 0 ? "No tours available" : "No tour"}</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              ) : (
                <div
                  style={{
                    ...inputStyle, padding: 6, opacity: isTemplate ? 0.5 : 1, pointerEvents: isTemplate ? "none" : "auto",
                    maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1,
                  }}
                >
                  {tours.length === 0 && (
                    <span style={{ fontSize: 12.5, color: "var(--gs-muted)", padding: "6px 6px" }}>No tours available</span>
                  )}
                  {tours.map(t => {
                    const checked = tourIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "6px 6px", borderRadius: 4,
                          fontSize: 13, color: "var(--foreground)", cursor: "pointer",
                          background: checked ? "rgba(var(--gs-accent-rgb), 0.07)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setTourIds(checked ? tourIds.filter(id => id !== t.id) : [...tourIds, t.id])}
                        />
                        {t.title}
                      </label>
                    );
                  })}
                </div>
              )}
              {!isTemplate && (
                <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 4, margin: "4px 0 0 0" }}>
                  {isEdit
                    ? "Assigning a tour makes this visible to every group in that tour."
                    : "Check multiple tours to create one linked copy per tour, each visible to every group in that tour."}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Duration (minutes) *</label>
              <input required type="number" min={1} placeholder="Enter duration (minutes)" style={inputStyle} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Passing Score (%) *</label>
              <input required type="number" min={0} max={100} placeholder="Enter passing marks" style={inputStyle} value={passing} onChange={e => setPassing(Number(e.target.value))} />
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
      </CardContent>
</Card>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((q, qIdx) => (
          <Card key={q.id}>
<CardContent>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gs-accent)", letterSpacing: "0.08em" }}>Q{qIdx + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQ(qIdx)} style={{ fontSize: 11, color: "var(--gs-danger-alt)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label style={labelStyle}>Question * (min 5 characters)</label>
                  <input required minLength={5} style={inputStyle} value={q.question} onChange={e => updateQ(qIdx, { question: e.target.value })} placeholder="Question text" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={q.type} onChange={e => updateQ(qIdx, { type: e.target.value as QuestionType, correct_answer: "", options: ["", ""] })}>
                    <option value="mcq">MCQ</option>
                    <option value="multi_select">Multi Select</option>
                    <option value="subjective">Subjective</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Marks</label>
                <input type="number" min={1} placeholder="Marks" style={{ ...inputStyle, width: 80 }} value={q.marks} onChange={e => updateQ(qIdx, { marks: Number(e.target.value) })} />
              </div>

              {q.type !== "subjective" && (
                <div>
                  <label style={labelStyle}>Options</label>
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
                          style={{ flexShrink: 0 }}
                        />
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          value={opt}
                          onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                        />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(qIdx, oIdx)} style={{ fontSize: 11, color: "var(--gs-danger-alt)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(qIdx)} style={{ fontSize: 12, color: "var(--gs-accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      + Add option
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 4 }}>
                    {q.type === "multi_select" ? "Check all correct answers." : "Select correct answer."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
</Card>
        ))}
      </div>

      <button type="button" onClick={addQ} style={{ fontSize: 13, color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.07)", border: "1.5px dashed rgba(var(--gs-accent-rgb), 0.3)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", width: "100%", marginBottom: 16 }}>
        + Add Question
      </button>

      {error && <p style={{ fontSize: 13, color: "var(--gs-danger-alt)", marginBottom: 12 }}>{error}</p>}

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
