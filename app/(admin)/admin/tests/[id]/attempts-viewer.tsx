"use client";

import { useState } from "react";
import { ExportButton } from "@/components/features/export-button";
import { ApproveRejectButtons } from "../approve-button";
import { VoidAttemptButton } from "../void-attempt-button";
import { saveSubjectiveEvaluation, editTestResult } from "@/actions/tests";
import { useRouter } from "next/navigation";
import { User, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import type { EligibilityTest, TestQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, string | string[]>;
  score?: number;
  subjective_marks?: Record<string, number>;
  status: "in_progress" | "submitted" | "evaluated" | "pending_approval" | "approved" | "rejected";
  started_at: string;
  submitted_at?: string;
  users: {
    name: string;
    email: string;
  };
}

export function TestAttemptsViewer({
  test,
  attempts,
}: {
  test: EligibilityTest;
  attempts: Attempt[];
}) {
  const router = useRouter();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    attempts.length > 0 ? attempts[0].id : null
  );
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(selectedAttemptId);
  const [savingEval, setSavingEval] = useState(false);
  const [scoreDraft, setScoreDraft] = useState("");
  const [editingScore, setEditingScore] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId);
  const questions = test.questions ?? [];

  if (selectedAttemptId !== lastAttemptId) {
    setLastAttemptId(selectedAttemptId);
    const initial: Record<string, string> = {};
    if (selectedAttempt?.subjective_marks) {
      for (const [qId, val] of Object.entries(selectedAttempt.subjective_marks)) {
        initial[qId] = String(val);
      }
    }
    setMarksDraft(initial);
    setScoreDraft(selectedAttempt?.score !== undefined && selectedAttempt?.score !== null ? String(selectedAttempt.score) : "");
    setEditingScore(false);
  }

  async function handleSaveEvaluation() {
    if (!selectedAttempt) return;
    setSavingEval(true);
    try {
      const marks: Record<string, number> = {};
      for (const [qId, val] of Object.entries(marksDraft)) {
        if (val !== "") marks[qId] = Number(val);
      }
      await saveSubjectiveEvaluation(selectedAttempt.id, marks);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save evaluation");
    } finally {
      setSavingEval(false);
    }
  }

  async function handleSaveScore() {
    if (!selectedAttempt) return;
    const score = Number(scoreDraft);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      alert("Score must be a number between 0 and 100");
      return;
    }
    setSavingScore(true);
    try {
      await editTestResult(selectedAttempt.id, score);
      setEditingScore(false);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update result");
    } finally {
      setSavingScore(false);
    }
  }

  // Prepare CSV Export Data
  const exportData = attempts.map((attempt) => {
    const row: Record<string, string> = {
      "Student Name": attempt.users?.name ?? "Unknown",
      "Student Email": attempt.users?.email ?? "Unknown",
      "Status": attempt.status,
      "Score (%)": attempt.score !== undefined && attempt.score !== null ? attempt.score.toFixed(1) + "%" : "N/A",
      "Started At": new Date(attempt.started_at).toLocaleString(),
      "Submitted At": attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "N/A",
    };

    questions.forEach((q, idx) => {
      const studentAns = attempt.answers?.[q.id];
      const formattedAns = Array.isArray(studentAns) ? studentAns.join(", ") : (studentAns ?? "");
      row[`Q${idx + 1}: ${q.question}`] = formattedAns;
    });

    return row;
  });

  function isAnswerCorrect(question: TestQuestion, studentAnswer: string | string[] | undefined) {
    if (!question.correct_answer) return null;
    if (question.type === "subjective") return null;

    if (Array.isArray(question.correct_answer)) {
      if (!Array.isArray(studentAnswer)) return false;
      if (question.correct_answer.length !== studentAnswer.length) return false;
      return question.correct_answer.every((val) => studentAnswer.includes(val));
    }

    return String(question.correct_answer).trim().toLowerCase() === String(studentAnswer ?? "").trim().toLowerCase();
  }

  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--gs-muted)" };

  return (
    <div>
      {/* Export Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
          Attempts ({attempts.length})
        </h2>
        {attempts.length > 0 && (
          <ExportButton
            data={exportData}
            filename={`${test.title.toLowerCase().replace(/\s+/g, "-")}-test-attempts.csv`}
            label="Export Attempts CSV"
          />
        )}
      </div>

      {attempts.length === 0 ? (
        <Card>
<CardContent>
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[var(--gs-muted)]" />
          <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>No attempts recorded for this test yet.</p>
        </CardContent>
</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Attempts List */}
          <div className="lg:col-span-5 space-y-2.5">
            {attempts.map((attempt) => {
              const isSelected = attempt.id === selectedAttemptId;
              const isPending = attempt.status === "pending_approval";
              const isApproved = attempt.status === "approved";
              const isRejected = attempt.status === "rejected";
              const didPass = (attempt.score ?? 0) >= test.passing_score;

              let statusColor = "var(--gs-muted)";
              let statusBg = "rgba(90,82,71,0.08)";
              if (isApproved) { statusColor = "var(--gs-success)"; statusBg = "rgba(var(--gs-success-rgb), 0.12)"; }
              else if (isRejected) { statusColor = "var(--gs-danger-alt)"; statusBg = "rgba(var(--gs-danger-alt-rgb), 0.08)"; }
              else if (isPending) { statusColor = "var(--gs-warning)"; statusBg = "rgba(var(--gs-warning-rgb), 0.12)"; }
              else if (attempt.status === "submitted" || attempt.status === "evaluated") {
                statusColor = didPass ? "var(--gs-success)" : "var(--gs-danger-alt)";
                statusBg = didPass ? "rgba(var(--gs-success-rgb), 0.08)" : "rgba(var(--gs-danger-alt-rgb), 0.08)";
              }

              return (
                <div
                  key={attempt.id}
                  onClick={() => setSelectedAttemptId(attempt.id)}
                  className="rounded-xl p-4 cursor-pointer transition-all border text-left"
                  style={{
                    background: "white",
                    borderColor: isSelected ? "var(--gs-accent)" : "var(--border)",
                    boxShadow: isSelected ? "0 0 0 1px var(--gs-accent)" : "none",
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                        {attempt.users?.name ?? "Unknown"}
                      </h4>
                      <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: 0 }}>
                        {attempt.users?.email}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: statusColor,
                        background: statusBg,
                        textTransform: "capitalize",
                      }}
                    >
                      {attempt.status === "pending_approval" ? "Pending Approval" : attempt.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid var(--gs-card)" }}>
                    <span style={{ fontSize: 11, color: "var(--gs-text-secondary)", display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock className="w-3.5 h-3.5" />
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "In progress"}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: didPass ? "var(--gs-success)" : "var(--gs-danger-alt)",
                      }}
                    >
                      {attempt.score !== undefined && attempt.score !== null ? attempt.score.toFixed(0) + "%" : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attempt Detail View */}
          <div className="lg:col-span-7">
            {selectedAttempt ? (
              <div className="rounded-xl p-6 border bg-white" style={{ borderColor: "var(--border)" }}>
                {/* Header */}
                <div className="flex justify-between items-start pb-5 mb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px 0" }}>
                      Response Details
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <User className="w-4 h-4 text-[var(--gs-muted)]" />
                      {selectedAttempt.users?.name} ({selectedAttempt.users?.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedAttempt.status === "pending_approval" && (
                      <ApproveRejectButtons attemptId={selectedAttempt.id} />
                    )}
                    <VoidAttemptButton attemptId={selectedAttempt.id} />
                  </div>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: "#F9F8F6", border: "1px solid var(--border)" }}>
                  <div>
                    <span style={labelStyle}>Status</span>
                    <p className="mt-1" style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: "4px 0 0 0", textTransform: "capitalize" }}>
                      {selectedAttempt.status === "pending_approval" ? "Pending Approval" : selectedAttempt.status}
                    </p>
                  </div>
                  <div>
                    <span style={labelStyle}>Score</span>
                    {editingScore ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Score"
                          value={scoreDraft}
                          onChange={(e) => setScoreDraft(e.target.value)}
                          disabled={savingScore}
                          className="w-16 h-7 text-xs px-2"
                        />
                        <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>%</span>
                        <Button
                          size="sm"
                          onClick={handleSaveScore}
                          disabled={savingScore}
                          className="h-7 text-xs px-2"
                        >
                          {savingScore ? "..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingScore(false)}
                          disabled={savingScore}
                          className="h-7 text-xs px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-2" style={{
                        fontSize: 14, fontWeight: 700,
                        color: (selectedAttempt.score ?? 0) >= test.passing_score ? "var(--gs-success)" : "var(--gs-danger-alt)",
                        margin: "4px 0 0 0"
                      }}>
                        {selectedAttempt.score !== undefined && selectedAttempt.score !== null ? selectedAttempt.score.toFixed(1) + "%" : "N/A"}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setEditingScore(true)}
                          className="h-auto p-0 text-xs font-semibold text-accent hover:text-accent/90"
                        >
                          Edit
                        </Button>
                      </p>
                    )}
                  </div>
                  <div>
                    <span style={labelStyle}>Result</span>
                    <p className="mt-1" style={{
                      fontSize: 14, fontWeight: 700,
                      color: (selectedAttempt.score ?? 0) >= test.passing_score ? "var(--gs-success)" : "var(--gs-danger-alt)",
                      margin: "4px 0 0 0"
                    }}>
                      {(selectedAttempt.score ?? 0) >= test.passing_score ? "PASSED" : "FAILED"}
                    </p>
                  </div>
                </div>

                {/* Questions Responses */}
                <div className="space-y-5">
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--gs-text-secondary)", margin: "0 0 10px 0" }}>
                    QUESTIONS & ANSWERS
                  </h4>

                  {questions.map((q, idx) => {
                    const studentAns = selectedAttempt.answers?.[q.id];
                    const correctness = isAnswerCorrect(q, studentAns);

                    return (
                      <div key={q.id} className="pb-4 border-b last:border-b-0" style={{ borderColor: "var(--gs-card)" }}>
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                            {idx + 1}. {q.question}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--gs-muted)", fontWeight: 500, flexShrink: 0 }}>
                            {q.marks} {q.marks === 1 ? "mark" : "marks"}
                          </span>
                        </div>

                        {/* Student Answer */}
                        <div className="mt-2.5 p-3 rounded-lg flex items-start gap-2.5" style={{
                          background: correctness === true ? "rgba(var(--gs-success-rgb), 0.04)" : correctness === false ? "rgba(var(--gs-danger-alt-rgb), 0.04)" : "#F9F8F6",
                          border: `1px solid ${correctness === true ? "rgba(var(--gs-success-rgb), 0.12)" : correctness === false ? "rgba(var(--gs-danger-alt-rgb), 0.12)" : "var(--border)"}`
                        }}>
                          {correctness === true && <CheckCircle2 className="w-4 h-4 text-[var(--gs-success)] flex-shrink-0 mt-0.5" />}
                          {correctness === false && <XCircle className="w-4 h-4 text-[var(--gs-danger-alt)] flex-shrink-0 mt-0.5" />}
                          {correctness === null && <AlertCircle className="w-4 h-4 text-[var(--gs-text-secondary)] flex-shrink-0 mt-0.5" />}

                          <div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase" }}>
                              Student Answer
                            </span>
                            <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0 0" }}>
                              {Array.isArray(studentAns)
                                ? studentAns.join(", ")
                                : (studentAns !== undefined && studentAns !== null && studentAns !== ""
                                  ? String(studentAns)
                                  : <em style={{ color: "var(--gs-muted)" }}>No response</em>)}
                            </p>
                          </div>
                        </div>

                        {/* Subjective marks entry */}
                        {q.type === "subjective" && (
                          <div className="mt-2.5 p-3 rounded-lg flex items-center gap-2.5" style={{ background: "#F9F8F6", border: "1px solid var(--border)", marginLeft: 26 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase" }}>
                              Marks Awarded
                            </span>
                            {selectedAttempt.status === "approved" || selectedAttempt.status === "rejected" ? (
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                {selectedAttempt.subjective_marks?.[q.id] ?? 0} / {q.marks}
                              </span>
                            ) : (
                              <>
                                <Input
                                  type="number"
                                  min={0}
                                  max={q.marks}
                                  placeholder="Marks"
                                  value={marksDraft[q.id] ?? ""}
                                  onChange={(e) => setMarksDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="w-16 h-7 text-xs px-2 inline-block"
                                />
                                <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>/ {q.marks}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Correct Answer (if incorrect or subjective) */}
                        {correctness !== true && q.correct_answer && (
                          <div className="mt-2 p-3 rounded-lg bg-[#FAF8F2] border border-[#EBE5D6]" style={{ marginLeft: 26 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase" }}>
                              Correct Answer
                            </span>
                            <p style={{ fontSize: 13, color: "var(--gs-success)", fontWeight: 500, margin: "2px 0 0 0" }}>
                              {Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : String(q.correct_answer)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {questions.some((q) => q.type === "subjective") &&
                  selectedAttempt.status !== "approved" &&
                  selectedAttempt.status !== "rejected" && (
                    <div className="flex justify-end pt-5 mt-5 border-t border-border">
                      <Button
                        onClick={handleSaveEvaluation}
                        disabled={savingEval}
                        size="sm"
                        className="font-semibold"
                      >
                        {savingEval ? "Saving..." : "Save Evaluation"}
                      </Button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="rounded-xl p-8 text-center bg-white border border-dashed" style={{ borderColor: "var(--border)" }}>
                <User className="w-8 h-8 mx-auto mb-2 text-[var(--gs-muted)]" />
                <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>Select a student attempt from the list to view response details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
