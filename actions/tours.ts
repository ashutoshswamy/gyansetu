"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { isEnrolleeRole } from "@/lib/clerk/roles";
import { auth } from "@clerk/nextjs/server";
import { tourSchema, type TourInput } from "@/lib/validations";
import { invalidateCache, CACHE_KEYS, redis } from "@/lib/redis/client";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";

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

  revalidatePath("/student/tours");
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
