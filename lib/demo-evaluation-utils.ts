import type { DemoEvaluationInput } from "@/lib/validations";

export function totalOf(scores: DemoEvaluationInput["scores"]) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}
