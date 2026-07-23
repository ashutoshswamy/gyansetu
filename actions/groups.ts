"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { tourGroupSchema, type TourGroupInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const requireAdmin = requireAdminUser;

export async function createGroup(input: TourGroupInput) {
  const { db, user } = await requireAdmin();
  const data = tourGroupSchema.parse(input);
  const { data: group, error } = await db
    .from("tour_groups")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createGroup]", error); throw new Error("Failed to create group"); }
  revalidatePath("/admin/groups");
  return group;
}

export async function updateGroup(id: string, input: Partial<TourGroupInput>) {
  const { db } = await requireAdmin();
  const data = tourGroupSchema.partial().parse(input);
  const { data: group, error } = await db
    .from("tour_groups")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateGroup]", error); throw new Error("Failed to update group"); }
  revalidatePath("/admin/groups");
  return group;
}

export async function deleteGroup(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("tour_groups").delete().eq("id", id);
  if (error) { console.error("[deleteGroup]", error); throw new Error("Failed to delete group"); }
  revalidatePath("/admin/groups");
}

export async function addGroupMember(groupId: string, userId: string, roleInGroup?: string) {
  const { db } = await requireAdmin();
  const { error } = await db
    .from("tour_group_members")
    .insert({ group_id: groupId, user_id: userId, role_in_group: roleInGroup });
  if (error) { console.error("[addGroupMember]", error); throw new Error("Failed to add group member"); }
  revalidatePath("/admin/groups");
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { db } = await requireAdmin();
  const { error } = await db
    .from("tour_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) { console.error("[removeGroupMember]", error); throw new Error("Failed to remove group member"); }
  revalidatePath("/admin/groups");
}

export async function getGroupsByTour(tourId: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("tour_groups")
    .select("*, tour_group_members(*, users(id, name, email, role)), users!tour_groups_mentor_id_fkey(id, name, email)")
    .eq("tour_id", tourId)
    .order("created_at", { ascending: true });
  if (error) { console.error("[getGroupsByTour]", error); throw new Error("Failed to fetch groups"); }
  return data ?? [];
}

export async function getMyGroup(tourId: string) {
  const { db, user } = await getAuthenticatedUser();
  const { data, error } = await db
    .from("tour_group_members")
    .select("*, tour_groups!inner(*, tours(id, title, destination))")
    .eq("user_id", user.id)
    .eq("tour_groups.tour_id", tourId)
    .maybeSingle();
  if (error) { console.error("[getMyGroup]", error); return null; }
  return data;
}
