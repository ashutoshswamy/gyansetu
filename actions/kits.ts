"use server";

import { requireAdminUser, requireVolunteerUser, assertGroupAccess } from "@/lib/clerk/action-auth";
import { notifyGroupMembers } from "@/actions/notifications";
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

export async function updateKitItem(id: string, input: Partial<KitItemInput>) {
  const { db } = await requireAdminUser();
  const data = kitItemSchema.partial().parse(input);
  const { data: item, error } = await db.from("kit_items").update(data).eq("id", id).select().single();
  if (error) { console.error("[updateKitItem]", error); throw new Error("Failed to update kit item"); }
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

  await notifyGroupMembers(data.group_id, "Kit assigned", "A teaching kit has been assigned to your group.")
    .catch(err => console.error("[upsertKitAssignment notify]", err));

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

// Packing checklist for a group: every catalog material, each with the Total Qty
// Required for that group's school_count (reusable = quantity_per_school as-is,
// consumable = quantity_per_school × school_count) plus whether it's been checked off.
export async function getKitChecklistForGroup(groupId: string) {
  const { db, user } = await requireVolunteerUser();
  await assertGroupAccess(db, user, groupId);

  const [{ data: items, error: itemsError }, { data: assignment, error: assignmentError }, { data: checks, error: checksError }] = await Promise.all([
    db.from("kit_items").select("*").order("category", { ascending: true }),
    db.from("kit_assignments").select("school_count").eq("group_id", groupId).maybeSingle(),
    db.from("kit_packing_checks").select("kit_item_id, checked").eq("group_id", groupId),
  ]);
  if (itemsError) { console.error("[getKitChecklistForGroup]", itemsError); throw new Error("Failed to fetch kit items"); }
  if (assignmentError) { console.error("[getKitChecklistForGroup]", assignmentError); throw new Error("Failed to fetch kit assignment"); }
  if (checksError) { console.error("[getKitChecklistForGroup]", checksError); throw new Error("Failed to fetch checklist"); }

  const schoolCount = assignment?.school_count ?? 1;
  const checkedByItem = new Map((checks ?? []).map(c => [c.kit_item_id, c.checked]));

  return (items ?? []).map(item => ({
    ...item,
    total_qty: item.material_type === "reusable" ? item.quantity_per_school : item.quantity_per_school * schoolCount,
    checked: checkedByItem.get(item.id) ?? false,
  }));
}

export async function toggleKitChecklistItem(groupId: string, kitItemId: string, checked: boolean) {
  const { db, user } = await requireVolunteerUser();
  await assertGroupAccess(db, user, groupId);

  const { error } = await db
    .from("kit_packing_checks")
    .upsert(
      { group_id: groupId, kit_item_id: kitItemId, checked, checked_at: checked ? new Date().toISOString() : null },
      { onConflict: "group_id,kit_item_id" }
    );
  if (error) { console.error("[toggleKitChecklistItem]", error); throw new Error("Failed to update checklist"); }
  revalidatePath("/volunteer/groups");
}
