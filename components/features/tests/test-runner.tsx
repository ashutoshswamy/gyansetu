"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitTestAttempt } from "@/actions/tests";
import type { TestQuestion } from "@/types";

const inp = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1.5px solid #E4DFD1",
  borderRadius: 8,
  background: "white",
  color: "#19140F",
  outline: "none",
  resize: "none" as const,
};

interface Test {
  id: string;
  duration_minutes: number;
  passing_score: number;
  questions: TestQuestion[];
}

export function TestRunner({ test }: { test: Test }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    if (timeLeft <= 0) handleSubmitRef.current();
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const question = test.questions[current];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  function setAnswer(qid: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function toggleMulti(qid: string, option: string) {
    const curr = (answers[qid] as string[]) ?? [];
    setAnswers((prev) => ({
      ...prev,
      [qid]: curr.includes(option) ? curr.filter((o) => o !== option) : [...curr, option],
    }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await submitTestAttempt({ test_id: test.id, answers });
      setResult({ score: data.score ?? 0, passed: data.passed ?? false });
    } catch {
      setSubmitting(false);
    }
  }

  if (result) {
    const passed = result.passed;
    return (
      <div className="rounded-xl p-10 text-center" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <div style={{ fontSize: 36, marginBottom: 12, color: passed ? "#2A5E3A" : "#B8381E" }}>
          {passed ? "✓" : "✗"}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", marginBottom: 8 }}>
          {passed ? "Test Passed" : "Test Submitted"}
        </h2>
        <p style={{ fontSize: 14, color: "#5A5247", marginBottom: 20 }}>
          Your score:{" "}
          <span style={{ fontWeight: 700, color: passed ? "#2A5E3A" : "#B8381E", fontFamily: "monospace" }}>
            {result.score.toFixed(1)}%
          </span>
        </p>

        {passed ? (
          <div style={{ background: "rgba(245,165,32,0.07)", border: "1px solid rgba(245,165,32,0.25)", borderRadius: 8, padding: "14px 20px", display: "inline-block", marginBottom: 16, maxWidth: 360 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#B45309", marginBottom: 4 }}>Pending Admin Approval</p>
            <p style={{ fontSize: 12, color: "#9B7830", lineHeight: 1.6 }}>
              Your result has been sent for admin review. Once approved, sign in again to access your volunteer dashboard.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#9B9188", marginBottom: 16 }}>
            Minimum required: {test.passing_score}%
          </p>
        )}

        <div>
          <button
            onClick={() => router.push("/student/tests")}
            style={{ background: "#19140F", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const progress = ((current + 1) / test.questions.length) * 100;
  const isTimeLow = timeLeft < 60;

  return (
    <div>
      {/* Progress bar + timer */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 12, color: "#9B9188" }}>
          Question {current + 1} of {test.questions.length}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: isTimeLow ? "#B8381E" : "#19140F" }}>
          {mins}:{secs}
        </span>
      </div>
      <div style={{ height: 4, background: "#E4DFD1", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#4A55BE", borderRadius: 2, transition: "width 0.2s" }} />
      </div>

      {/* Question card */}
      <div className="rounded-xl p-6 mb-5" style={{ background: "white", border: "1px solid #E4DFD1" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#19140F", marginBottom: 16 }}>{question.question}</p>

        {question.type === "mcq" && (
          <div className="space-y-2">
            {question.options?.map((opt) => {
              const selected = answers[question.id] === opt;
              return (
                <label
                  key={opt}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                  style={{ border: `1.5px solid ${selected ? "#4A55BE" : "#E4DFD1"}`, background: selected ? "rgba(74,85,190,0.06)" : "white", transition: "all 0.1s" }}
                >
                  <input type="radio" name={question.id} value={opt} checked={selected} onChange={() => setAnswer(question.id, opt)} style={{ accentColor: "#4A55BE" }} />
                  <span style={{ fontSize: 14, color: "#19140F" }}>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "multi_select" && (
          <div className="space-y-2">
            {question.options?.map((opt) => {
              const selected = ((answers[question.id] as string[]) ?? []).includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                  style={{ border: `1.5px solid ${selected ? "#4A55BE" : "#E4DFD1"}`, background: selected ? "rgba(74,85,190,0.06)" : "white", transition: "all 0.1s" }}
                >
                  <input type="checkbox" checked={selected} onChange={() => toggleMulti(question.id, opt)} style={{ accentColor: "#4A55BE" }} />
                  <span style={{ fontSize: 14, color: "#19140F" }}>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "subjective" && (
          <textarea
            value={(answers[question.id] as string) ?? ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            rows={5}
            placeholder="Type your answer here..."
            style={{ ...inp, display: "block" }}
          />
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          style={{ fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 6, border: "1.5px solid #E4DFD1", background: "white", color: current === 0 ? "#C8C4BC" : "#5A5247", cursor: current === 0 ? "not-allowed" : "pointer" }}
        >
          Previous
        </button>

        {current < test.questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            style={{ fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", background: "#4A55BE", color: "white", cursor: "pointer" }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", background: submitting ? "#C8C4BC" : "#2A5E3A", color: "white", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        )}
      </div>
    </div>
  );
}
