"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { demoEvaluationSchema, type DemoEvaluationInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function totalOf(scores: DemoEvaluationInput["scores"]) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

export async function createDemoEvaluation(input: DemoEvaluationInput) {
  const { db, user } = await requireAdminUser();
  const data = demoEvaluationSchema.parse(input);
  const { data: evaluation, error } = await db
    .from("demo_evaluations")
    .insert({ ...data, observer_id: user.id, total_score: totalOf(data.scores) })
    .select()
    .single();
  if (error) { console.error("[createDemoEvaluation]", error); throw new Error("Failed to create evaluation"); }
  revalidatePath("/admin/demo-evaluations");
  return evaluation;
}

export async function updateDemoEvaluation(id: string, input: Partial<DemoEvaluationInput>) {
  const { db } = await requireAdminUser();
  const data = demoEvaluationSchema.partial().parse(input);
  const patch: Record<string, unknown> = { ...data };
  if (data.scores) patch.total_score = totalOf(data.scores);
  const { data: evaluation, error } = await db
    .from("demo_evaluations")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateDemoEvaluation]", error); throw new Error("Failed to update evaluation"); }
  revalidatePath("/admin/demo-evaluations");
  return evaluation;
}

export async function getAllDemoEvaluations() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("demo_evaluations")
    .select(
      "*, volunteer:users!demo_evaluations_volunteer_id_fkey(id, name, email), observer:users!demo_evaluations_observer_id_fkey(id, name), tour:tours(id, title)"
    )
    .order("evaluated_at", { ascending: false });
  if (error) { console.error("[getAllDemoEvaluations]", error); throw new Error("Failed to fetch evaluations"); }
  return data ?? [];
}

export async function getMyDemoEvaluations() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("demo_evaluations")
    .select("*, tour:tours(id, title)")
    .eq("volunteer_id", user.id)
    .order("evaluated_at", { ascending: false });
  if (error) { console.error("[getMyDemoEvaluations]", error); throw new Error("Failed to fetch evaluations"); }
  return data ?? [];
}
