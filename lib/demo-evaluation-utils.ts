import type { DemoEvaluationInput } from "@/lib/validations";

// Plain module (no "use client"): safe to import from both Server and Client Components.
// Importing this array from a "use client" module into a Server Component turns it into a
// client-reference proxy — .map then throws. That was the demo-evaluation detail page crash.
export const SCORE_FIELDS = [
  { key: "hindi_english_communication", label: "Hindi / English Communication" },
  { key: "concept_clarity", label: "Concept Clarity" },
  { key: "communication_skills", label: "Communication Skills" },
  { key: "presentation_skills", label: "Presentation Skills" },
  { key: "confidence_body_language", label: "Confidence & Body Language" },
  { key: "student_engagement", label: "Student Engagement" },
  { key: "activity_demonstration", label: "Activity Demonstration" },
  { key: "team_coordination", label: "Team Coordination" },
  { key: "time_session_management", label: "Time & Session Management" },
  { key: "overall_readiness", label: "Overall Readiness" },
] as const;

export type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];

export function totalOf(scores: DemoEvaluationInput["scores"]) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}
