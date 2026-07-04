import { describe, it, expect } from "vitest";
import { scoreTestAttempt } from "./scoring";
import type { TestQuestion } from "@/types";

describe("scoreTestAttempt", () => {
  it("scores a correct mcq answer", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "mcq", question: "2+2?", correct_answer: "4", marks: 10 },
    ];
    const result = scoreTestAttempt(questions, { q1: "4" }, 50);
    expect(result.score).toBe(10);
    expect(result.percentScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("gives zero marks for a wrong mcq answer", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "mcq", question: "2+2?", correct_answer: "4", marks: 10 },
    ];
    const result = scoreTestAttempt(questions, { q1: "5" }, 50);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("requires an exact set match for multi_select, order-independent", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "multi_select", question: "pick primes", correct_answer: ["2", "3", "5"], marks: 10 },
    ];
    const exact = scoreTestAttempt(questions, { q1: ["5", "2", "3"] }, 50);
    expect(exact.score).toBe(10);

    const partial = scoreTestAttempt(questions, { q1: ["2", "3"] }, 50);
    expect(partial.score).toBe(0);

    const extra = scoreTestAttempt(questions, { q1: ["2", "3", "5", "7"] }, 50);
    expect(extra.score).toBe(0);
  });

  it("awards no automatic marks for subjective questions", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "subjective", question: "explain yourself", marks: 20 },
    ];
    const result = scoreTestAttempt(questions, { q1: "an essay" }, 0);
    expect(result.score).toBe(0);
    expect(result.totalMarks).toBe(20);
  });

  it("computes weighted percent across mixed question types", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "mcq", question: "a", correct_answer: "x", marks: 10 },
      { id: "q2", type: "mcq", question: "b", correct_answer: "y", marks: 30 },
    ];
    // only q1 correct: 10/40 = 25%
    const result = scoreTestAttempt(questions, { q1: "x", q2: "wrong" }, 25);
    expect(result.percentScore).toBe(25);
    expect(result.passed).toBe(true);
  });

  it("treats missing answers as incorrect, not a crash", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "mcq", question: "a", correct_answer: "x", marks: 10 },
      { id: "q2", type: "multi_select", question: "b", correct_answer: ["a", "b"], marks: 10 },
    ];
    const result = scoreTestAttempt(questions, {}, 0);
    expect(result.score).toBe(0);
    expect(result.percentScore).toBe(0);
  });

  it("returns 0 percent for a test with no questions instead of dividing by zero", () => {
    const result = scoreTestAttempt([], {}, 50);
    expect(result.totalMarks).toBe(0);
    expect(result.percentScore).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("passes exactly at the passing_score boundary", () => {
    const questions: TestQuestion[] = [
      { id: "q1", type: "mcq", question: "a", correct_answer: "x", marks: 10 },
    ];
    const result = scoreTestAttempt(questions, { q1: "x" }, 100);
    expect(result.percentScore).toBe(100);
    expect(result.passed).toBe(true);
  });
});
