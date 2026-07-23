"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { eligibilityTestSchema, testAttemptSchema } from "@/lib/validations";
import type { EligibilityTestInput, TestAttemptInput } from "@/lib/validations";
import { scoreTestAttempt } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import type { TestQuestion } from "@/types";
import { ZodError } from "zod";

// Server Actions have their thrown-error messages redacted in production —
// validation failures must be returned as data instead of thrown, or the
// client only ever sees "An error occurred..." with a digest.
function describeZodError(err: ZodError): string {
  const first = err.issues[0];
  if (!first) return "Invalid input";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

const testRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, "1 h"),
});

export async function createTest(input: EligibilityTestInput) {
  const { db, user } = await requireAdminUser();

  let data: EligibilityTestInput;
  try {
    data = eligibilityTestSchema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) return { ok: false as const, error: describeZodError(err) };
    throw err;
  }

  const { data: test, error } = await db
    .from("eligibility_tests")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createTest]", error); return { ok: false as const, error: "Failed to create test" }; }

  revalidatePath("/admin/tests");
  return { ok: true as const, test };
}

export async function updateTest(id: string, input: EligibilityTestInput) {
  const { db } = await requireAdminUser();

  let data: EligibilityTestInput;
  try {
    data = eligibilityTestSchema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) return { ok: false as const, error: describeZodError(err) };
    throw err;
  }

  const { data: test, error } = await db
    .from("eligibility_tests")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updateTest]", error); return { ok: false as const, error: "Failed to update test" }; }

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${id}/edit`);

  return { ok: true as const, test };
}

export async function deleteTest(id: string) {
  const { db } = await requireAdminUser();

  const { error } = await db.from("eligibility_tests").delete().eq("id", id);
  if (error) { console.error("[deleteTest]", error); throw new Error("Failed to delete test"); }

  revalidatePath("/admin/tests");
}

export async function submitTestAttempt(input: TestAttemptInput) {
  const { db, user, userId } = await getAuthenticatedUser();

  const { success } = await testRatelimit.limit(`test-submit:${userId}`);
  if (!success) throw new Error("Too many attempts. Please wait before trying again.");

  const { test_id, answers } = testAttemptSchema.parse(input);

  const { data: test } = await db
    .from("eligibility_tests")
    .select("questions, passing_score, tour_id, is_template")
    .eq("id", test_id)
    .single();

  if (!test) throw new Error("Test not found");
  if (test.is_template) throw new Error("Test not available");

  const { data: existing } = await db
    .from("test_attempts")
    .select("id")
    .eq("test_id", test_id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (existing) throw new Error("You have already submitted this test");

  const { percentScore, passed } = scoreTestAttempt(test.questions, answers, test.passing_score);

  // If passed → pending_approval (admin must approve before role is promoted)
  // If not passed → submitted
  const attemptStatus = passed ? "pending_approval" : "submitted";

  const { data, error } = await db
    .from("test_attempts")
    .insert({
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

export async function saveSubjectiveEvaluation(attemptId: string, marks: Record<string, number>) {
  const { db } = await requireAdminUser();

  const { data: attempt, error: fetchError } = await db
    .from("test_attempts")
    .select("id, test_id, answers, status")
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) throw new Error("Attempt not found");
  if (attempt.status === "approved" || attempt.status === "rejected") {
    throw new Error("Attempt already finalized");
  }

  const { data: test, error: testError } = await db
    .from("eligibility_tests")
    .select("questions, passing_score")
    .eq("id", attempt.test_id)
    .single();

  if (testError || !test) throw new Error("Test not found");

  const questions = test.questions as TestQuestion[];
  const subjectiveMarks: Record<string, number> = {};
  for (const q of questions) {
    if (q.type === "subjective" && marks[q.id] !== undefined) {
      subjectiveMarks[q.id] = Math.max(0, Math.min(Number(marks[q.id]) || 0, q.marks));
    }
  }

  const { percentScore, passed } = scoreTestAttempt(
    questions,
    attempt.answers,
    test.passing_score,
    subjectiveMarks
  );

  const { error } = await db
    .from("test_attempts")
    .update({
      subjective_marks: subjectiveMarks,
      score: percentScore,
      status: passed ? "pending_approval" : "submitted",
    })
    .eq("id", attemptId);

  if (error) { console.error("[saveSubjectiveEvaluation]", error); throw new Error("Failed to save evaluation"); }

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${attempt.test_id}`);
}

export async function approveTestResult(attemptId: string) {
  const { db } = await requireAdminUser();

  const { data: attempt, error: fetchError } = await db
    .from("test_attempts")
    .select("id, student_id, status, users!test_attempts_student_id_fkey(id, clerk_id, role), eligibility_tests(tour_id)")
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) throw new Error("Attempt not found");
  if (attempt.status !== "pending_approval") throw new Error("Attempt is not pending approval");

  const student = attempt.users as unknown as { id: string; clerk_id: string; role: string | null };
  const tourId = (attempt.eligibility_tests as unknown as { tour_id: string | null } | null)?.tour_id;
  if (!student?.clerk_id) throw new Error("Student Clerk ID missing");

  // 1. Promote in Supabase first (source of truth)
  const { error: dbError } = await db.from("users").update({ role: "volunteer" }).eq("id", student.id);
  if (dbError) throw new Error("Failed to promote role in database");

  // 2. Sync Clerk; rollback Supabase if Clerk fails
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUserMetadata(student.clerk_id, { publicMetadata: { role: "volunteer" } });
  } catch {
    await db.from("users").update({ role: student.role ?? null }).eq("id", student.id);
    throw new Error("Failed to update auth provider; role change rolled back");
  }

  // 3. Mark attempt approved
  await db.from("test_attempts").update({ status: "approved" }).eq("id", attemptId);

  // 4. Advance the enrollee to the next application stage
  if (tourId) {
    await db
      .from("tour_applications")
      .update({ status: "selected", updated_at: new Date().toISOString() })
      .eq("tour_id", tourId)
      .eq("student_id", student.id);
  }

  // 5. Force re-auth (best-effort — stale JWT expires naturally if this fails)
  try {
    await revokeAllUserSessions(student.clerk_id);
  } catch {
    console.error("[approveTestResult] session revoke failed; user will re-auth on next expiry");
  }

  revalidatePath("/admin/tests");
  revalidatePath("/admin/students");
  revalidatePath("/admin/tours");
  revalidatePath("/student/tours");
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
  const { error: dbError } = await db.from("users").update({ role: "enrollee" }).eq("id", userId);
  if (dbError) throw new Error("Failed to demote role in database");

  // 2. Sync Clerk; rollback if it fails
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUserMetadata(student.clerk_id, { publicMetadata: { role: "enrollee" } });
  } catch {
    await db.from("users").update({ role: "volunteer" }).eq("id", userId);
    throw new Error("Failed to update auth provider; demotion rolled back");
  }

  // 3. Revert any approved test attempts for this user back to pending_approval
  const { data: revertedAttempts } = await db
    .from("test_attempts")
    .update({ status: "pending_approval" })
    .eq("student_id", userId)
    .eq("status", "approved")
    .select("id, eligibility_tests(tour_id)");

  // 3b. Revert matching applications back to shortlisted
  const tourIds = (revertedAttempts ?? [])
    .map((a) => (a.eligibility_tests as unknown as { tour_id: string | null } | null)?.tour_id)
    .filter((id): id is string => !!id);

  if (tourIds.length > 0) {
    await db
      .from("tour_applications")
      .update({ status: "shortlisted", updated_at: new Date().toISOString() })
      .eq("student_id", userId)
      .in("tour_id", tourIds)
      .eq("status", "selected");
  }

  // 4. Force re-auth
  try {
    await revokeAllUserSessions(student.clerk_id);
  } catch {
    console.error("[demoteVolunteer] session revoke failed");
  }

  revalidatePath("/admin/tests");
  revalidatePath("/admin/students");
  revalidatePath("/admin/tours");
  revalidatePath("/student/tours");
}

export async function rejectTestResult(attemptId: string) {
  const { db } = await requireAdminUser();

  const { data: attempt, error: fetchError } = await db
    .from("test_attempts")
    .select("id, student_id, eligibility_tests(tour_id)")
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) throw new Error("Attempt not found");
  const tourId = (attempt.eligibility_tests as unknown as { tour_id: string | null } | null)?.tour_id;

  const { error } = await db
    .from("test_attempts")
    .update({ status: "rejected" })
    .eq("id", attemptId);

  if (error) { console.error("[rejectTestResult]", error); throw new Error("Failed to reject test result"); }

  // Decline the enrollee's application for this tour too
  if (tourId) {
    await db
      .from("tour_applications")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("tour_id", tourId)
      .eq("student_id", attempt.student_id);
  }

  revalidatePath("/admin/tests");
  revalidatePath("/admin/students");
  revalidatePath("/admin/tours");
  revalidatePath("/student/tours");
}
