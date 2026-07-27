"use server";

import { requireAdminUser, requireSuperAdminUser } from "@/lib/clerk/action-auth";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types";

const ASSIGNABLE_ROLES: UserRole[] = ["admin", "earc_staff"];

async function applyRoleUpdate(db: ReturnType<typeof createServerClient>, clerkId: string, role: UserRole) {
  const { data: prev, error: fetchError } = await db
    .from("users")
    .select("role")
    .eq("clerk_id", clerkId)
    .single();
  if (fetchError || !prev) throw new Error("User not found");

  // 1. Update Supabase first (source of truth)
  const { error } = await db.from("users").update({ role }).eq("clerk_id", clerkId);
  if (error) throw new Error("Failed to update role");

  // 2. Sync Clerk; rollback Supabase if Clerk fails
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUserMetadata(clerkId, { publicMetadata: { role } });
  } catch {
    await db.from("users").update({ role: prev.role }).eq("clerk_id", clerkId);
    throw new Error("Failed to update auth provider; role change rolled back");
  }

  await revokeAllUserSessions(clerkId);
}

export async function getAllUsers() {
  const { db } = await requireSuperAdminUser();

  const { data, error } = await db
    .from("users")
    .select("id, clerk_id, name, email, role, created_at")
    .in("role", ["super_admin", "admin", "earc_staff"])
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load users");
  return data;
}

export async function updateUserRole(clerkId: string, role: UserRole) {
  const { db, userId } = await requireSuperAdminUser();

  if (!clerkId || typeof clerkId !== "string") throw new Error("Invalid user");
  if (!ASSIGNABLE_ROLES.includes(role)) throw new Error("Invalid role");
  if (clerkId === userId) throw new Error("Cannot change your own role");

  await applyRoleUpdate(db, clerkId, role);
}

// Admins (not just super_admin) can grant/revoke the earc_staff role, but nothing else —
// keeps admin -> admin/super_admin escalation impossible.
export async function getEarcCandidates() {
  const { db } = await requireAdminUser();

  const { data, error } = await db
    .from("users")
    .select("id, clerk_id, name, email, role, created_at")
    .or("role.is.null,role.in.(enrollee,volunteer,earc_staff)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load users");
  // Rows with a null role are enrollees whose Clerk JWT hasn't synced yet —
  // display them as such rather than leaking the raw null.
  return (data ?? []).map(u => ({ ...u, role: u.role ?? "enrollee" }));
}

export async function setEarcStaffRole(clerkId: string, grant: boolean) {
  const { db, userId } = await requireAdminUser();

  if (!clerkId || typeof clerkId !== "string") throw new Error("Invalid user");
  if (clerkId === userId) throw new Error("Cannot change your own role");

  const { data: target, error: fetchError } = await db
    .from("users")
    .select("role")
    .eq("clerk_id", clerkId)
    .single();
  if (fetchError || !target) throw new Error("User not found");
  if (target.role === "admin" || target.role === "super_admin") {
    throw new Error("Cannot change an admin's role here");
  }

  // ponytail: revoking always drops back to "enrollee", losing the original
  // enrollee/volunteer distinction — fine for now, revisit if that matters.
  await applyRoleUpdate(db, clerkId, grant ? "earc_staff" : "enrollee");
}

// Safety net for when the Clerk webhook isn't configured (no endpoint registered,
// or "user.deleted" not subscribed) — without it, deleting a user directly in the
// Clerk dashboard never reaches this app, so the Supabase row (and everything
// cascading from it) is orphaned forever. Admin-triggered reconciliation: anyone
// in Supabase whose clerk_id no longer exists in Clerk gets removed here.
export async function syncDeletedUsers() {
  const { db } = await requireSuperAdminUser();

  const clerk = await clerkClient();
  const clerkIds = new Set<string>();
  const limit = 500;
  let offset = 0;
  while (true) {
    const { data } = await clerk.users.getUserList({ limit, offset });
    for (const u of data) clerkIds.add(u.id);
    if (data.length < limit) break;
    offset += limit;
  }

  const { data: dbUsers, error } = await db.from("users").select("id, clerk_id, name, email");
  if (error) { console.error("[syncDeletedUsers]", error); throw new Error("Failed to load users"); }

  const orphaned = (dbUsers ?? []).filter(u => u.clerk_id && !clerkIds.has(u.clerk_id));
  if (orphaned.length === 0) return { removed: 0, names: [] as string[] };

  const { error: deleteError } = await db.from("users").delete().in("id", orphaned.map(u => u.id));
  if (deleteError) { console.error("[syncDeletedUsers]", deleteError); throw new Error("Failed to delete orphaned users"); }

  revalidatePath("/admin/super-admin");
  revalidatePath("/admin/earc-staff");
  return { removed: orphaned.length, names: orphaned.map(u => u.name || u.email) };
}

export async function deleteUser(clerkId: string) {
  const { db, userId } = await requireSuperAdminUser();

  if (!clerkId || typeof clerkId !== "string") throw new Error("Invalid user");
  if (clerkId === userId) throw new Error("Cannot delete your own account");

  // Delete in Clerk first — this fires a user.deleted webhook that also removes
  // the Supabase row, but we delete it here too so the UI reflects it immediately
  // without waiting on webhook delivery. Re-deleting an already-gone row is a no-op.
  const clerk = await clerkClient();
  await clerk.users.deleteUser(clerkId);

  const { error } = await db.from("users").delete().eq("clerk_id", clerkId);
  if (error) throw new Error("Failed to delete user record");
}
