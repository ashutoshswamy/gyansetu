"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { volunteerProfileSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const getUser = getAuthenticatedUser;
const requireAdmin = requireAdminUser;

export async function upsertVolunteerProfile(input: unknown) {
  const { db, user } = await getUser();
  const data = volunteerProfileSchema.parse(input);
  const consentPayload = data.consent_given
    ? { consent_given: true, consent_given_at: new Date().toISOString() }
    : {};
  const { data: result, error } = await db
    .from("volunteer_profiles")
    .upsert(
      { ...data, ...consentPayload, user_id: user.id, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) { console.error("[upsertVolunteerProfile]", error); throw new Error("Failed to save profile"); }
  revalidatePath("/volunteer/profile");
  return result;
}

export async function getMyVolunteerProfile() {
  const { db, user } = await getUser();
  const { data } = await db.from("volunteer_profiles").select("*").eq("user_id", user.id).single();
  return data;
}

export async function getVolunteerProfileById(userId: string) {
  const { db } = await requireAdmin();
  const { data } = await db
    .from("volunteer_profiles")
    .select("*, users(id, name, email, role, avatar_url, created_at)")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function getAllVolunteerProfiles() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("volunteer_profiles")
    .select("*, users(id, name, email, role, created_at)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllVolunteerProfiles]", error); throw new Error("Failed to fetch profiles"); }
  return data ?? [];
}

export async function setAadhaarVerified(userId: string, verified: boolean) {
  const { db, user } = await requireAdmin();
  const { data, error } = await db
    .from("volunteer_profiles")
    .update({
      aadhaar_verified: verified,
      aadhaar_verified_at: verified ? new Date().toISOString() : null,
      aadhaar_verified_by: verified ? user.id : null,
    })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) { console.error("[setAadhaarVerified]", error); throw new Error("Failed to update Aadhaar verification"); }
  revalidatePath("/admin/profiles");
  return data;
}
