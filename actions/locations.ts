"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { myLocationSchema, type MyLocationInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Live Volunteer Location Sharing

export async function startSharingLocation() {
  const { db, user } = await requireVolunteerUser();
  const { error } = await db
    .from("volunteer_locations")
    .upsert({ user_id: user.id, is_sharing: true, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) { console.error("[startSharingLocation]", error); throw new Error("Failed to start sharing location"); }
}

export async function updateMyLocation(input: MyLocationInput) {
  const { db, user } = await requireVolunteerUser();
  const data = myLocationSchema.parse(input);

  const { data: existing } = await db
    .from("volunteer_locations")
    .select("is_sharing")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing?.is_sharing) return;

  const { error } = await db
    .from("volunteer_locations")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) { console.error("[updateMyLocation]", error); throw new Error("Failed to update location"); }
}

export async function stopSharingLocation() {
  const { db, user } = await requireVolunteerUser();
  const { error } = await db
    .from("volunteer_locations")
    .upsert(
      { user_id: user.id, is_sharing: false, latitude: null, longitude: null, accuracy: null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) { console.error("[stopSharingLocation]", error); throw new Error("Failed to stop sharing location"); }
  revalidatePath("/volunteer/location");
}

export async function getMySharingStatus() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("volunteer_locations")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) { console.error("[getMySharingStatus]", error); throw new Error("Failed to fetch sharing status"); }
  return data;
}

export async function getGroupVolunteerLocations(groupId: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("tour_group_members")
    .select("user_id, users(id, name, email, volunteer_locations(latitude, longitude, accuracy, is_sharing, updated_at))")
    .eq("group_id", groupId);
  if (error) { console.error("[getGroupVolunteerLocations]", error); throw new Error("Failed to fetch volunteer locations"); }

  type Row = {
    user_id: string;
    users: {
      name: string;
      email: string;
      volunteer_locations: {
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        is_sharing: boolean;
        updated_at: string;
      } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((row) => row.users?.volunteer_locations?.is_sharing && row.users.volunteer_locations.latitude != null)
    .map((row) => ({
      user_id: row.user_id,
      name: row.users!.name,
      email: row.users!.email,
      latitude: row.users!.volunteer_locations!.latitude as number,
      longitude: row.users!.volunteer_locations!.longitude as number,
      accuracy: row.users!.volunteer_locations!.accuracy,
      updated_at: row.users!.volunteer_locations!.updated_at,
    }));
}
