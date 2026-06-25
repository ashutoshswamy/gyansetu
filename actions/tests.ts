"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { eligibilityTestSchema, testAttemptSchema } from "@/lib/validations";
import type { EligibilityTestInput, TestAttemptInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";

const testRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, "1 h"),
});

export async function createTest(input: EligibilityTestInput) {
  const { db, user } = await requireAdminUser();
  const data = eligibilityTestSchema.parse(input);

  const { data: test, error } = await db
    .from("eligibility_tests")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createTest]", error); throw new Error("Failed to create test"); }

  revalidatePath("/admin/tests");
  return test;
}

export async function submitTestAttempt(input: TestAttemptInput) {
  const { db, user, userId } = await getAuthenticatedUser();

  const { success } = await testRatelimit.limit(`test-submit:${userId}`);
  if (!success) throw new Error("Too many attempts. Please wait before trying again.");

  const { test_id, answers } = testAttemptSchema.parse(input);

  const { data: test } = await db
    .from("eligibility_tests")
    .select("questions, passing_score, tour_id")
    .eq("id", test_id)
    .single();

  if (!test) throw new Error("Test not found");

  let score = 0;
  let totalMarks = 0;

  for (const q of test.questions) {
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
  const passed = percentScore >= test.passing_score;

  // If passed → pending_approval (admin must approve before role is promoted)
  // If not passed → submitted
  const attemptStatus = passed ? "pending_approval" : "submitted";

  const { data, error } = await db
    .from("test_attempts")
    .upsert({
      test_id,
      student_id: user.id,
      answers,
      score: percentScore,
      status: attemptStatus,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { console.error("[submitTestAttempt]", error); throw new Error("Failed to submit test attempt"); }

  if (test.tour_id) {
    await db
      .from("tour_applications")
      .update({ test_score: percentScore })
      .eq("tour_id", test.tour_id)
      .eq("student_id", user.id);
  }

  revalidatePath("/student/tests");
  return { ...data, passed, score: percentScore };
}

export async function approveTestResult(attemptId: string) {
  const { db } = await requireAdminUser();

  const { data: attempt, error: fetchError } = await db
    .from("test_attempts")
    .select("id, student_id, status, users!test_attempts_student_id_fkey(id, clerk_id, role)")
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) throw new Error("Attempt not found");
  if (attempt.status !== "pending_approval") throw new Error("Attempt is not pending approval");

  const student = attempt.users as any;
  if (!student?.clerk_id) throw new Error("Student Clerk ID missing");

  // 1. Promote in Supabase first (source of truth)
  const { error: dbError } = await db.from("users").update({ role: "volunteer" }).eq("id", student.id);
  if (dbError) throw new Error("Failed to promote role in database");

  // 2. Sync Clerk; rollback Supabase if Clerk fails
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUserMetadata(student.clerk_id, { publicMetadata: { role: "volunteer" } });
  } catch (err) {
    await db.from("users").update({ role: student.role ?? null }).eq("id", student.id);
    throw new Error("Failed to update auth provider; role change rolled back");
  }

  // 3. Mark attempt approved
  await db.from("test_attempts").update({ status: "approved" }).eq("id", attemptId);

  // 4. Force re-auth (best-effort — stale JWT expires naturally if this fails)
  try {
    await revokeAllUserSessions(student.clerk_id);
  } catch {
    console.error("[approveTestResult] session revoke failed; user will re-auth on next expiry");
  }

  revalidatePath("/admin/tests");
  revalidatePath("/admin/students");
}

export async function demoteVolunteer(userId: string) {
  const { db } = await requireAdminUser();

  const { data: student, error: fetchError } = await db
    .from("users")
    .select("id, clerk_id, role")
    .eq("id", userId)
    .single();

  if (fetchError || !student) throw new Error("User not found");
  if (student.role !== "volunteer") throw new Error("User is not a volunteer");
  if (!student.clerk_id) throw new Error("User Clerk ID missing");

  // 1. Reset Supabase role
  const { error: dbError } = await db.from("users").update({ role: null }).eq("id", userId);
  if (dbError) throw new Error("Failed to demote role in database");

  // 2. Sync Clerk; rollback if it fails
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUserMetadata(student.clerk_id, { publicMetadata: { role: null } });
  } catch {
    await db.from("users").update({ role: "volunteer" }).eq("id", userId);
    throw new Error("Failed to update auth provider; demotion rolled back");
  }

  // 3. Revert any approved test attempts for this user back to pending_approval
  await db
    .from("test_attempts")
    .update({ status: "pending_approval" })
    .eq("student_id", userId)
    .eq("status", "approved");

  // 4. Force re-auth
  try {
    await revokeAllUserSessions(student.clerk_id);
  } catch {
    console.error("[demoteVolunteer] session revoke failed");
  }

  revalidatePath("/admin/tests");
  revalidatePath("/admin/students");
}

export async function rejectTestResult(attemptId: string) {
  const { db } = await requireAdminUser();

  const { error } = await db
    .from("test_attempts")
    .update({ status: "rejected" })
    .eq("id", attemptId);

  if (error) { console.error("[rejectTestResult]", error); throw new Error("Failed to reject test result"); }

  revalidatePath("/admin/tests");
}
