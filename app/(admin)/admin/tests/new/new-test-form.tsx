"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTest, updateTest } from "@/actions/tests";
import type { EligibilityTest } from "@/types";

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
  const [tourId, setTourId] = useState(initialData?.tour_id ?? "");
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
    setSaving(true);
    setError("");
    const payload = {
      title,
      description: description || undefined,
      tour_id: isTemplate ? null : (tourId || null),
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
      if (isEdit) {
        await updateTest(initialData.id, payload);
      } else {
        await createTest(payload);
      }
      router.push(isTemplate ? "/admin/tests/templates" : "/admin/tests");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save test");
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
          <p style={{ fontSize: 11, color: "#9B9188", marginTop: 6, margin: "6px 0 0 0" }}>
            * Selecting a template will overwrite the details and questions in the builder below.
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9B9188", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Test Details</p>
        <div className="space-y-3">
          <div>
            <label style={labelStyle}>Title *</label>
            <input required style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Test title" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional instructions for students" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Test Type *</label>
              <select style={inputStyle} value={isTemplate ? "template" : "link"} onChange={e => {
                const val = e.target.value === "template";
                setIsTemplate(val);
                if (val) setTourId("");
              }}>
                <option value="link">Standard Test</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Linked Tour {isTemplate ? "" : "*"}</label>
              <select required={!isTemplate} disabled={isTemplate} style={{ ...inputStyle, opacity: isTemplate ? 0.5 : 1 }} value={tourId} onChange={e => setTourId(e.target.value)}>
                <option value="">{tours.length === 0 ? "No tours available" : "No tour"}</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Duration (minutes) *</label>
              <input required type="number" min={1} style={inputStyle} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Passing Score (%) *</label>
              <input required type="number" min={0} max={100} style={inputStyle} value={passing} onChange={e => setPassing(Number(e.target.value))} />
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

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-xl p-5" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4A55BE", letterSpacing: "0.08em" }}>Q{qIdx + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQ(qIdx)} style={{ fontSize: 11, color: "#B8381E", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label style={labelStyle}>Question *</label>
                  <input required style={inputStyle} value={q.question} onChange={e => updateQ(qIdx, { question: e.target.value })} placeholder="Question text" />
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
                <input type="number" min={1} style={{ ...inputStyle, width: 80 }} value={q.marks} onChange={e => updateQ(qIdx, { marks: Number(e.target.value) })} />
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
                          <button type="button" onClick={() => removeOption(qIdx, oIdx)} style={{ fontSize: 11, color: "#B8381E", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(qIdx)} style={{ fontSize: 12, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      + Add option
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>
                    {q.type === "multi_select" ? "Check all correct answers." : "Select correct answer."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addQ} style={{ fontSize: 13, color: "#4A55BE", background: "rgba(74,85,190,0.07)", border: "1.5px dashed rgba(74,85,190,0.3)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", width: "100%", marginBottom: 16 }}>
        + Add Question
      </button>

      {error && <p style={{ fontSize: 13, color: "#B8381E", marginBottom: 12 }}>{error}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} style={{ fontSize: 13, padding: "9px 18px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving || (!isTemplate && tours.length === 0)} style={{ fontSize: 13, fontWeight: 600, padding: "9px 22px", borderRadius: 6, border: "none", background: saving ? "#C8C4BC" : "#19140F", color: "white", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Test"}
        </button>
      </div>
    </form>
  );
}
