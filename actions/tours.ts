"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { createNotification } from "@/actions/notifications";
import { applyRoleUpdate } from "@/actions/users";
import { isEnrolleeRole } from "@/lib/clerk/roles";
import { auth } from "@clerk/nextjs/server";
import { tourSchema, type TourInput } from "@/lib/validations";
import { invalidateCache, CACHE_KEYS, redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";
import { getClientIp } from "@/lib/rate-limit";

const applyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 h"),
});

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
