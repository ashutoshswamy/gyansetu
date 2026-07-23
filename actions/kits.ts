"use server";

import { requireAdminUser, requireVolunteerUser, assertGroupAccess } from "@/lib/clerk/action-auth";
import { kitItemSchema, kitAssignmentSchema, type KitItemInput, type KitAssignmentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Kit catalog

export async function createKitItem(input: KitItemInput) {
  const { db } = await requireAdminUser();
  const data = kitItemSchema.parse(input);
  const { data: item, error } = await db.from("kit_items").insert(data).select().single();
  if (error) { console.error("[createKitItem]", error); throw new Error("Failed to create kit item"); }
  revalidatePath("/admin/kits");
  return item;
}

export async function deleteKitItem(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("kit_items").delete().eq("id", id);
  if (error) { console.error("[deleteKitItem]", error); throw new Error("Failed to delete kit item"); }
  revalidatePath("/admin/kits");
}

export async function getAllKitItems() {
  const { db } = await requireAdminUser();
  const { data, error } = await db.from("kit_items").select("*").order("category", { ascending: true });
  if (error) { console.error("[getAllKitItems]", error); throw new Error("Failed to fetch kit items"); }
  return data ?? [];
}

// Per-group kit assignment

export async function upsertKitAssignment(input: KitAssignmentInput) {
  const { db, user } = await requireAdminUser();
  const data = kitAssignmentSchema.parse(input);
  const { data: assignment, error } = await db
    .from("kit_assignments")
    .upsert({ ...data, created_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "group_id" })
    .select()
    .single();
  if (error) { console.error("[upsertKitAssignment]", error); throw new Error("Failed to save kit assignment"); }
  revalidatePath("/admin/kits");
  return assignment;
}

export async function markKitDistributed(groupId: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("kit_assignments")
    .update({ distributed: true, distributed_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) { console.error("[markKitDistributed]", error); throw new Error("Failed to mark distributed"); }
  revalidatePath("/admin/kits");
  return data;
}

export async function getAllKitAssignments() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("kit_assignments")
    .select("*, group:tour_groups(id, name, tour_id)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllKitAssignments]", error); throw new Error("Failed to fetch kit assignments"); }
  return data ?? [];
}

export async function getKitAssignmentForMyGroup(groupId: string) {
  const { db, user } = await requireVolunteerUser();
  await assertGroupAccess(db, user, groupId);
  const { data, error } = await db
    .from("kit_assignments")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();
  if (error) { console.error("[getKitAssignmentForMyGroup]", error); throw new Error("Failed to fetch kit assignment"); }
  return data;
}
