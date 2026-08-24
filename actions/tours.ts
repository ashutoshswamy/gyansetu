"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { createNotification } from "@/actions/notifications";
import { applyRoleUpdate } from "@/actions/users";
import { isEnrolleeRole } from "@/lib/clerk/roles";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { tourSchema, withdrawalRequestSchema, type TourInput } from "@/lib/validations";
import { invalidateCache, CACHE_KEYS, redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";
import { getClientIp } from "@/lib/rate-limit";

const applyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 h"),
});

// Scoped to the tours the current volunteer is actually assigned to — feeds
// tour-select dropdowns in volunteer-facing forms (daily log), same reasoning as
// getGroupsForSelect: showing every tour in the system would let a volunteer log
// against a tour they aren't on.
export async function getMyToursForSelect() {
  const { db, user } = await getAuthenticatedUser();
  const { data, error } = await db
    .from("volunteer_assignments")
    .select("tours!inner(id, title)")
    .eq("volunteer_id", user.id)
    .order("assigned_at", { ascending: false });
  if (error) { console.error("[getMyToursForSelect]", error); throw new Error("Failed to fetch tours"); }
  return (data ?? []).map(a => a.tours as unknown as { id: string; title: string });
}

export async function createTour(input: TourInput) {
  const { db, user } = await requireAdminUser();
  const data = tourSchema.parse(input);

  const { data: tour, error } = await db
    .from("tours")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createTour]", error); throw new Error("Failed to create tour"); }

  await invalidateCache(CACHE_KEYS.activeTours);
  await invalidateCache(CACHE_KEYS.dashboardStats);
  revalidatePath("/admin/tours");

  return tour;
}

export async function updateTour(id: string, input: Partial<TourInput>) {
  const { db } = await requireAdminUser();
  const data = tourSchema.partial().parse(input);

  const { data: tour, error } = await db
    .from("tours")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updateTour]", error); throw new Error("Failed to update tour"); }

  await invalidateCache(CACHE_KEYS.activeTours);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${id}`);

  return tour;
}

// Ends a tour: status -> completed, and demotes any assigned "volunteer" back to
// "enrollee" — but only if this was their last active (open/draft) assignment, so
// someone double-booked across tours doesn't lose access to the other one.
// group_core_member is left untouched entirely (core members keep the role; the
// tour just moves to their dashboard's history, per product decision).
export async function endTour(tourId: string) {
  const { db } = await requireAdminUser();

  const { error: statusError } = await db
    .from("tours")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", tourId);
  if (statusError) { console.error("[endTour]", statusError); throw new Error("Failed to end tour"); }

  const { data: assignments, error: assignError } = await db
    .from("volunteer_assignments")
    .select("volunteer_id, users(id, clerk_id, role)")
    .eq("tour_id", tourId);
  if (assignError) { console.error("[endTour]", assignError); throw new Error("Failed to load assignments"); }

  for (const a of assignments ?? []) {
    const assignee = a.users as unknown as { id: string; clerk_id: string; role: string | null } | null;
    if (!assignee || assignee.role !== "volunteer") continue;

    const { data: otherAssignments } = await db
      .from("volunteer_assignments")
      .select("tour_id, tours(status)")
      .eq("volunteer_id", assignee.id)
      .neq("tour_id", tourId);

    const stillActiveElsewhere = (otherAssignments ?? []).some((row) =>
      ["open", "draft"].includes((row.tours as { status?: string } | null)?.status ?? "")
    );
    if (stillActiveElsewhere) continue;

    await applyRoleUpdate(db, assignee.clerk_id, "enrollee");
    await db.from("tour_end_demotions").upsert(
      { tour_id: tourId, user_id: assignee.id },
      { onConflict: "tour_id,user_id" }
    );
  }

  await invalidateCache(CACHE_KEYS.activeTours);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}`);
  revalidatePath("/volunteer");
  revalidatePath("/volunteer/tours");
  revalidatePath("/enrollee");
}

// Reopens a completed tour. "admin" mode flips status back to open for admin editing
// only (kept out of volunteer/enrollee-facing lists via participant_visible=false, no
// role changes). "all" mode makes it fully visible again and restores every volunteer
// who was demoted because of this specific tour's End Tour (tour_end_demotions).
export async function reactivateTour(tourId: string, mode: "admin" | "all") {
  const { db } = await requireAdminUser();

  const { error: statusError } = await db
    .from("tours")
    .update({ status: "open", participant_visible: mode === "all", updated_at: new Date().toISOString() })
    .eq("id", tourId);
  if (statusError) { console.error("[reactivateTour]", statusError); throw new Error("Failed to reactivate tour"); }

  if (mode === "all") {
    const { data: demotions, error: demotionsError } = await db
      .from("tour_end_demotions")
      .select("user_id, users(clerk_id)")
      .eq("tour_id", tourId);
    if (demotionsError) { console.error("[reactivateTour]", demotionsError); throw new Error("Failed to load demotions"); }

    for (const d of demotions ?? []) {
      const clerkId = (d.users as unknown as { clerk_id: string } | null)?.clerk_id;
      if (clerkId) await applyRoleUpdate(db, clerkId, "volunteer");
    }

    await db.from("tour_end_demotions").delete().eq("tour_id", tourId);
  }

  await invalidateCache(CACHE_KEYS.activeTours);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}`);
  revalidatePath("/volunteer");
  revalidatePath("/volunteer/tours");
  revalidatePath("/enrollee");
}

export async function deleteTour(id: string) {
  const { db } = await requireAdminUser();

  const { error } = await db.from("tours").delete().eq("id", id);
  if (error) { console.error("[deleteTour]", error); throw new Error("Failed to delete tour"); }

  await invalidateCache(CACHE_KEYS.activeTours);
  await invalidateCache(CACHE_KEYS.dashboardStats);
  revalidatePath("/admin/tours");
}

export async function applyForTour(tourId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { success } = await applyRatelimit.limit(`apply:${userId}`);
  if (!success) throw new Error("Too many applications. Please wait before trying again.");

  const ip = await getClientIp();
  const { success: ipOk } = await applyRatelimit.limit(`apply:ip:${ip}`);
  if (!ipOk) throw new Error("Too many applications. Please wait before trying again.");

  const { db, user } = await getAuthenticatedUser();

  if (!isEnrolleeRole(user.role)) throw new Error("Only unenrolled users can apply for tours");

  const { data: existingApplication } = await db
    .from("tour_applications")
    .select("id")
    .eq("student_id", user.id)
    .maybeSingle();

  if (existingApplication) {
    throw new Error("You have already applied for a tour. Only one tour application is allowed.");
  }

  const { data: profile } = await db
    .from("volunteer_profiles")
    .select("date_of_birth")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.date_of_birth) {
    throw new Error("Please complete your profile with your date of birth before applying.");
  }

  const ageMs = Date.now() - new Date(profile.date_of_birth).getTime();
  const age = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) {
    throw new Error("You must be 18 or older to apply for a tour.");
  }

  const { data: tour } = await db
    .from("tours")
    .select("capacity")
    .eq("id", tourId)
    .maybeSingle();

  if (tour) {
    const { count } = await db
      .from("tour_applications")
      .select("id", { count: "exact", head: true })
      .eq("tour_id", tourId)
      .in("status", ["pending", "shortlisted", "selected"]);

    if ((count ?? 0) >= tour.capacity) {
      throw new Error("This tour has reached its member limit. Applications are closed.");
    }
  }

  const { data, error } = await db
    .from("tour_applications")
    .insert({ tour_id: tourId, student_id: user.id })
    .select()
    .single();

  if (error) { console.error("[applyForTour]", error); throw new Error("Failed to submit application"); }

  revalidatePath("/enrollee/tours");
  return data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "shortlisted" | "selected" | "rejected"
) {
  const { db } = await requireAdminUser();

  const { data, error } = await db
    .from("tour_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) { console.error("[updateApplicationStatus]", error); throw new Error("Failed to update application"); }

  await invalidateCache(CACHE_KEYS.dashboardStats);
  revalidatePath("/admin/tours");
  revalidatePath("/admin/students");
  return data;
}

// Enrollee requests to withdraw their own application, with a reason. Doesn't
// change status directly to "withdrawn" — sits at "withdrawal_requested" until
// an admin approves or rejects it. Prior status is saved so a rejected request
// restores the applicant exactly where they were.
export async function requestWithdrawal(applicationId: string, reason: string) {
  const { db, user } = await getAuthenticatedUser();
  const data = withdrawalRequestSchema.parse({ reason });

  const { data: application, error: fetchError } = await db
    .from("tour_applications")
    .select("id, tour_id, student_id, status")
    .eq("id", applicationId)
    .single();
  if (fetchError || !application) throw new Error("Application not found");
  if (application.student_id !== user.id) throw new Error("Unauthorized");
  if (!["pending", "shortlisted", "selected"].includes(application.status)) {
    throw new Error("This application can't be withdrawn right now.");
  }

  const { error } = await db
    .from("tour_applications")
    .update({
      status: "withdrawal_requested",
      withdrawal_reason: data.reason,
      withdrawal_requested_at: new Date().toISOString(),
      withdrawal_prior_status: application.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (error) { console.error("[requestWithdrawal]", error); throw new Error("Failed to submit withdrawal request"); }

  revalidatePath(`/enrollee/tours/${application.tour_id}`);
  revalidatePath("/volunteer/tours");
  revalidatePath("/admin/students");
  revalidatePath("/admin/withdrawals");
}

// Admin approves a pending withdrawal request: application status -> withdrawn.
// If the applicant had already been promoted to volunteer for this tour, also
// reverts their role back to enrollee and drops the tour assignment — same
// unwind as demoteVolunteer, just triggered by their own withdrawal request.
export async function approveWithdrawal(applicationId: string) {
  const { db } = await requireAdminUser();

  const { data: application, error: fetchError } = await db
    .from("tour_applications")
    .select("id, tour_id, status, student:users!tour_applications_student_id_fkey(id, clerk_id, role)")
    .eq("id", applicationId)
    .eq("status", "withdrawal_requested")
    .single();
  if (fetchError || !application) throw new Error("Withdrawal request not found");

  const student = application.student as unknown as { id: string; clerk_id: string; role: string | null };

  const { error } = await db
    .from("tour_applications")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (error) { console.error("[approveWithdrawal]", error); throw new Error("Failed to approve withdrawal"); }

  if (student.role === "volunteer" && student.clerk_id) {
    const { error: dbError } = await db.from("users").update({ role: "enrollee" }).eq("id", student.id);
    if (dbError) {
      console.error("[approveWithdrawal] failed to demote role", dbError);
    } else {
      const clerk = await clerkClient();
      try {
        await clerk.users.updateUserMetadata(student.clerk_id, { publicMetadata: { role: "enrollee" } });
      } catch (err) {
        console.error("[approveWithdrawal] Clerk role sync failed; rolling back", err);
        await db.from("users").update({ role: "volunteer" }).eq("id", student.id);
      }

      await db.from("volunteer_assignments").delete().eq("volunteer_id", student.id).eq("tour_id", application.tour_id);

      try {
        await revokeAllUserSessions(student.clerk_id);
      } catch (err) {
        console.error("[approveWithdrawal] session revoke failed", err);
      }
    }
  }

  await createNotification({
    user_id: student.id,
    title: "Withdrawal approved",
    message: "Your withdrawal from the tour has been approved.",
  }).catch(err => console.error("[approveWithdrawal notify]", err));

  revalidatePath("/admin/students");
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin/volunteers");
  revalidatePath("/enrollee/tours");
  revalidatePath("/volunteer");
  revalidatePath("/volunteer/tours");
}

// Admin declines a withdrawal request: application is restored to its status
// before the request was made (e.g. back to "shortlisted").
export async function rejectWithdrawal(applicationId: string) {
  const { db } = await requireAdminUser();

  const { data: application, error: fetchError } = await db
    .from("tour_applications")
    .select("student_id, withdrawal_prior_status")
    .eq("id", applicationId)
    .eq("status", "withdrawal_requested")
    .single();
  if (fetchError || !application) throw new Error("Withdrawal request not found");

  const { error } = await db
    .from("tour_applications")
    .update({
      status: application.withdrawal_prior_status ?? "pending",
      withdrawal_reason: null,
      withdrawal_requested_at: null,
      withdrawal_prior_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (error) { console.error("[rejectWithdrawal]", error); throw new Error("Failed to reject withdrawal"); }

  await createNotification({
    user_id: application.student_id,
    title: "Withdrawal request declined",
    message: "Your request to withdraw from the tour was declined.",
  }).catch(err => console.error("[rejectWithdrawal notify]", err));

  revalidatePath("/admin/students");
  revalidatePath("/admin/withdrawals");
  revalidatePath("/enrollee/tours");
  revalidatePath("/volunteer/tours");
}

export async function assignVolunteerToTour(tourId: string, volunteerId: string, roleDescription?: string) {
  const { db } = await requireAdminUser();

  const { error } = await db
    .from("volunteer_assignments")
    .upsert(
      { tour_id: tourId, volunteer_id: volunteerId, role_description: roleDescription || null },
      { onConflict: "tour_id,volunteer_id" }
    );

  if (error) { console.error("[assignVolunteerToTour]", error); throw new Error("Failed to assign volunteer"); }

  const { data: tour } = await db.from("tours").select("title").eq("id", tourId).maybeSingle();
  await createNotification({
    user_id: volunteerId,
    title: "Assigned to a tour",
    message: tour?.title ? `You've been assigned to "${tour.title}".` : "You've been assigned to a tour.",
  }).catch(err => console.error("[assignVolunteerToTour notify]", err));

  revalidatePath(`/admin/tours/${tourId}`);
  revalidatePath("/admin/volunteers");
  revalidatePath("/volunteer");
  revalidatePath("/volunteer/tours");
}

export async function removeVolunteerFromTour(tourId: string, volunteerId: string) {
  const { db } = await requireAdminUser();

  const { error } = await db
    .from("volunteer_assignments")
    .delete()
    .eq("tour_id", tourId)
    .eq("volunteer_id", volunteerId);

  if (error) { console.error("[removeVolunteerFromTour]", error); throw new Error("Failed to remove volunteer"); }

  revalidatePath(`/admin/tours/${tourId}`);
  revalidatePath("/admin/volunteers");
  revalidatePath("/volunteer");
  revalidatePath("/volunteer/tours");
}
