"use server";

import { requireAdminUser, getAuthenticatedUser, requireCoreMemberUser } from "@/lib/clerk/action-auth";
import { applyRoleUpdate } from "@/actions/users";
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

export async function getAllGroups() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("tour_groups")
    .select("id, name, tours(title)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllGroups]", error); throw new Error("Failed to fetch groups"); }
  return data ?? [];
}

// Scoped to the current user's own group memberships — this feeds group-select
// dropdowns in volunteer-facing forms (expenses, school reports), where showing
// every group in the system would let a volunteer submit data against a group
// they aren't part of.
export async function getGroupsForSelect() {
  const { db, user } = await getAuthenticatedUser();
  const { data, error } = await db
    .from("tour_groups")
    .select("id, name, tours(title), tour_group_members!inner(user_id)")
    .eq("tour_group_members.user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getGroupsForSelect]", error); throw new Error("Failed to fetch groups"); }
  return data ?? [];
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

// Promotes/demotes a group member to the "group_core_member" role — both the per-group
// tag (role_in_group) and the user's global role (so they can reach the /core-member
// dashboard, gated the same way /earc is gated for earc_staff). Blocked for admins/EARC
// staff, same guard setEarcStaffRole uses.
// ponytail: revoking always drops back to "volunteer" — core members are always promoted
// out of the volunteer pool, so that's the correct fallback (no distinction to lose).
export async function setGroupCoreMember(groupId: string, userId: string, grant: boolean) {
  const { db } = await requireAdminUser();

  const { data: target, error: fetchError } = await db
    .from("users")
    .select("clerk_id, role")
    .eq("id", userId)
    .single();
  if (fetchError || !target) throw new Error("User not found");
  if (["admin", "super_admin", "earc_staff"].includes(target.role ?? "")) {
    throw new Error("Cannot change this user's role here");
  }

  const { error } = await db
    .from("tour_group_members")
    .update({ role_in_group: grant ? "group_core_member" : "volunteer" })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) { console.error("[setGroupCoreMember]", error); throw new Error("Failed to update group role"); }

  await applyRoleUpdate(db, target.clerk_id, grant ? "group_core_member" : "volunteer");
  revalidatePath(`/admin/groups/${groupId}`);
}

// Feeds the core member's own dashboard: every group they've led, current and past.
// Current vs. history is derived from the joined tour's status, same bucketing the
// volunteer "My Tours" page uses (open/draft = current, closed/completed = history) —
// no separate transfer/history table needed since past tour_group_members rows are
// never deleted on reassignment.
export async function getMyCoreMemberAssignments() {
  const { db, user } = await requireCoreMemberUser();
  const { data, error } = await db
    .from("tour_group_members")
    .select("*, tour_groups!inner(*, tours(id, title, destination, start_date, end_date, status), tour_group_members(*, users(id, name, email)))")
    .eq("user_id", user.id)
    .eq("role_in_group", "group_core_member")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getMyCoreMemberAssignments]", error); throw new Error("Failed to fetch assignments"); }
  return data ?? [];
}
