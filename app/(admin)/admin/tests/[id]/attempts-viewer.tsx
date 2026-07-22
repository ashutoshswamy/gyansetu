"use client";

import { useState } from "react";
import { ExportButton } from "@/components/features/export-button";
import { ApproveRejectButtons } from "../approve-button";
import { saveSubjectiveEvaluation } from "@/actions/tests";
import { useRouter } from "next/navigation";
import { User, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import type { EligibilityTest, TestQuestion } from "@/types";

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

  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9B9188" };

  return (
    <div>
      {/* Export Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#19140F" }}>
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
        <div className="rounded-xl p-8 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#9B9188]" />
          <p style={{ fontSize: 14, color: "#9B9188" }}>No attempts recorded for this test yet.</p>
        </div>
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

              let statusColor = "#9B9188";
              let statusBg = "rgba(90,82,71,0.08)";
              if (isApproved) { statusColor = "#2A5E3A"; statusBg = "rgba(42,94,58,0.12)"; }
              else if (isRejected) { statusColor = "#B8381E"; statusBg = "rgba(184,56,30,0.08)"; }
              else if (isPending) { statusColor = "#F5A520"; statusBg = "rgba(245,165,32,0.12)"; }
              else if (attempt.status === "submitted" || attempt.status === "evaluated") {
                statusColor = didPass ? "#2A5E3A" : "#B8381E";
                statusBg = didPass ? "rgba(42,94,58,0.08)" : "rgba(184,56,30,0.08)";
              }

              return (
                <div
                  key={attempt.id}
                  onClick={() => setSelectedAttemptId(attempt.id)}
                  className="rounded-xl p-4 cursor-pointer transition-all border text-left"
                  style={{
                    background: "white",
                    borderColor: isSelected ? "#4A55BE" : "#E4DFD1",
                    boxShadow: isSelected ? "0 0 0 1px #4A55BE" : "none",
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>
                        {attempt.users?.name ?? "Unknown"}
                      </h4>
                      <p style={{ fontSize: 11, color: "#9B9188", margin: 0 }}>
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

                  <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid #F3F0E8" }}>
                    <span style={{ fontSize: 11, color: "#5A5247", display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock className="w-3.5 h-3.5" />
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "In progress"}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: didPass ? "#2A5E3A" : "#B8381E",
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
              <div className="rounded-xl p-6 border bg-white" style={{ borderColor: "#E4DFD1" }}>
                {/* Header */}
                <div className="flex justify-between items-start pb-5 mb-5" style={{ borderBottom: "1px solid #E4DFD1" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#19140F", margin: "0 0 4px 0" }}>
                      Response Details
                    </h3>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <User className="w-4 h-4 text-[#9B9188]" />
                      {selectedAttempt.users?.name} ({selectedAttempt.users?.email})
                    </p>
                  </div>

                  {selectedAttempt.status === "pending_approval" && (
                    <ApproveRejectButtons attemptId={selectedAttempt.id} />
                  )}
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: "#F9F8F6", border: "1px solid #E4DFD1" }}>
                  <div>
                    <span style={labelStyle}>Status</span>
                    <p className="mt-1" style={{ fontSize: 14, fontWeight: 700, color: "#19140F", margin: "4px 0 0 0", textTransform: "capitalize" }}>
                      {selectedAttempt.status === "pending_approval" ? "Pending Approval" : selectedAttempt.status}
                    </p>
                  </div>
                  <div>
                    <span style={labelStyle}>Score</span>
                    <p className="mt-1" style={{
                      fontSize: 14, fontWeight: 700,
                      color: (selectedAttempt.score ?? 0) >= test.passing_score ? "#2A5E3A" : "#B8381E",
                      margin: "4px 0 0 0"
                    }}>
                      {selectedAttempt.score !== undefined && selectedAttempt.score !== null ? selectedAttempt.score.toFixed(1) + "%" : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span style={labelStyle}>Result</span>
                    <p className="mt-1" style={{
                      fontSize: 14, fontWeight: 700,
                      color: (selectedAttempt.score ?? 0) >= test.passing_score ? "#2A5E3A" : "#B8381E",
                      margin: "4px 0 0 0"
                    }}>
                      {(selectedAttempt.score ?? 0) >= test.passing_score ? "PASSED" : "FAILED"}
                    </p>
                  </div>
                </div>

                {/* Questions Responses */}
                <div className="space-y-5">
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "#5A5247", margin: "0 0 10px 0" }}>
                    QUESTIONS & ANSWERS
                  </h4>

                  {questions.map((q, idx) => {
                    const studentAns = selectedAttempt.answers?.[q.id];
                    const correctness = isAnswerCorrect(q, studentAns);

                    return (
                      <div key={q.id} className="pb-4 border-b last:border-b-0" style={{ borderColor: "#F3F0E8" }}>
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>
                            {idx + 1}. {q.question}
                          </span>
                          <span style={{ fontSize: 11, color: "#9B9188", fontWeight: 500, flexShrink: 0 }}>
                            {q.marks} {q.marks === 1 ? "mark" : "marks"}
                          </span>
                        </div>

                        {/* Student Answer */}
                        <div className="mt-2.5 p-3 rounded-lg flex items-start gap-2.5" style={{
                          background: correctness === true ? "rgba(42,94,58,0.04)" : correctness === false ? "rgba(184,56,30,0.04)" : "#F9F8F6",
                          border: `1px solid ${correctness === true ? "rgba(42,94,58,0.12)" : correctness === false ? "rgba(184,56,30,0.12)" : "#E4DFD1"}`
                        }}>
                          {correctness === true && <CheckCircle2 className="w-4 h-4 text-[#2A5E3A] flex-shrink-0 mt-0.5" />}
                          {correctness === false && <XCircle className="w-4 h-4 text-[#B8381E] flex-shrink-0 mt-0.5" />}
                          {correctness === null && <AlertCircle className="w-4 h-4 text-[#5A5247] flex-shrink-0 mt-0.5" />}

                          <div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9188", textTransform: "uppercase" }}>
                              Student Answer
                            </span>
                            <p style={{ fontSize: 13, color: "#19140F", margin: "2px 0 0 0" }}>
                              {Array.isArray(studentAns)
                                ? studentAns.join(", ")
                                : (studentAns !== undefined && studentAns !== null && studentAns !== ""
                                  ? String(studentAns)
                                  : <em style={{ color: "#9B9188" }}>No response</em>)}
                            </p>
                          </div>
                        </div>

                        {/* Subjective marks entry */}
                        {q.type === "subjective" && (
                          <div className="mt-2.5 p-3 rounded-lg flex items-center gap-2.5" style={{ background: "#F9F8F6", border: "1px solid #E4DFD1", marginLeft: 26 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9188", textTransform: "uppercase" }}>
                              Marks Awarded
                            </span>
                            {selectedAttempt.status === "approved" || selectedAttempt.status === "rejected" ? (
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#19140F" }}>
                                {selectedAttempt.subjective_marks?.[q.id] ?? 0} / {q.marks}
                              </span>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  max={q.marks}
                                  value={marksDraft[q.id] ?? ""}
                                  onChange={(e) => setMarksDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  style={{ width: 60, fontSize: 13, padding: "4px 8px", borderRadius: 4, border: "1px solid #E4DFD1" }}
                                />
                                <span style={{ fontSize: 12, color: "#9B9188" }}>/ {q.marks}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Correct Answer (if incorrect or subjective) */}
                        {correctness !== true && q.correct_answer && (
                          <div className="mt-2 p-3 rounded-lg bg-[#FAF8F2] border border-[#EBE5D6]" style={{ marginLeft: 26 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9188", textTransform: "uppercase" }}>
                              Correct Answer
                            </span>
                            <p style={{ fontSize: 13, color: "#2A5E3A", fontWeight: 500, margin: "2px 0 0 0" }}>
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
                    <div className="flex justify-end pt-5 mt-5" style={{ borderTop: "1px solid #E4DFD1" }}>
                      <button
                        onClick={handleSaveEvaluation}
                        disabled={savingEval}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 6,
                          background: savingEval ? "#C8C4BC" : "#4A55BE", color: "white", border: "none",
                          cursor: savingEval ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingEval ? "Saving..." : "Save Evaluation"}
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="rounded-xl p-8 text-center bg-white border border-dashed" style={{ borderColor: "#E4DFD1" }}>
                <User className="w-8 h-8 mx-auto mb-2 text-[#9B9188]" />
                <p style={{ fontSize: 14, color: "#9B9188" }}>Select a student attempt from the list to view response details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
