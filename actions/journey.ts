"use server";

import { randomBytes } from "node:crypto";
import { requireAdminUser } from "@/lib/clerk/action-auth";

// Admin-only: one live parent link per tour group.

export async function getGroupShareLink(groupId: string) {
  const { db } = await requireAdminUser();
  const { data } = await db
    .from("parent_share_links")
    .select("token")
    .eq("group_id", groupId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.token ?? null;
}

// Also serves as "regenerate": revokes any live link first.
export async function createGroupShareLink(groupId: string) {
  const { db } = await requireAdminUser();
  await db
    .from("parent_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .is("revoked_at", null);
  const token = randomBytes(24).toString("base64url");
  const { error } = await db.from("parent_share_links").insert({ group_id: groupId, token });
  if (error) { console.error("[createGroupShareLink]", error); throw new Error("Failed to create link"); }
  return token;
}

export async function revokeGroupShareLink(groupId: string) {
  const { db } = await requireAdminUser();
  const { error } = await db
    .from("parent_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .is("revoked_at", null);
  if (error) { console.error("[revokeGroupShareLink]", error); throw new Error("Failed to revoke link"); }
}
