import type { TestQuestion } from "@/types";

type Answers = Record<string, string | string[]>;

export function scoreTestAttempt(
  questions: TestQuestion[],
  answers: Answers,
  passingScore: number
): { score: number; totalMarks: number; percentScore: number; passed: boolean } {
  let score = 0;
  let totalMarks = 0;

  for (const q of questions) {
    totalMarks += q.marks;
    if (q.type === "mcq" && q.correct_answer) {
      if (answers[q.id] === q.correct_answer) score += q.marks;
    } else if (q.type === "multi_select" && q.correct_answer) {
      const userAnswer = (answers[q.id] as string[]) ?? [];
      const correct = q.correct_answer as string[];
      if (
        userAnswer.length === correct.length &&
        userAnswer.every((a: string) => correct.includes(a))
      ) {
        score += q.marks;
      }
    }
    // subjective: score added by admin review
  }

  const percentScore = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const passed = percentScore >= passingScore;

  return { score, totalMarks, percentScore, passed };
}
