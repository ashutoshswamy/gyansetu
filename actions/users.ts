"use server";

import { requireSuperAdminUser } from "@/lib/clerk/action-auth";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { clerkClient } from "@clerk/nextjs/server";
import type { UserRole } from "@/types";

const ASSIGNABLE_ROLES: (UserRole | null)[] = ["volunteer", "admin", "earc_staff", "super_admin", null];

export async function getAllUsers() {
  const { db } = await requireSuperAdminUser();

  const { data, error } = await db
    .from("users")
    .select("id, clerk_id, name, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load users");
  return data;
}

export async function updateUserRole(clerkId: string, role: UserRole | null) {
  const { db, userId } = await requireSuperAdminUser();

  if (!clerkId || typeof clerkId !== "string") throw new Error("Invalid user");
  if (!ASSIGNABLE_ROLES.includes(role)) throw new Error("Invalid role");
  if (clerkId === userId) throw new Error("Cannot change your own role");

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, { publicMetadata: { role } });

  const { error } = await db.from("users").update({ role }).eq("clerk_id", clerkId);
  if (error) throw new Error("Failed to update role");

  await revokeAllUserSessions(clerkId);
}
