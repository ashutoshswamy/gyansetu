"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { localHostSchema, type LocalHostInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createLocalHost(input: LocalHostInput) {
  const { db, user } = await requireAdminUser();
  const data = localHostSchema.parse(input);
  const { data: host, error } = await db
    .from("local_hosts")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createLocalHost]", error); throw new Error("Failed to create local host"); }
  revalidatePath("/admin/local-hosts");
  return host;
}

export async function updateLocalHost(id: string, input: Partial<LocalHostInput>) {
  const { db } = await requireAdminUser();
  const data = localHostSchema.partial().parse(input);
  const { data: host, error } = await db
    .from("local_hosts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateLocalHost]", error); throw new Error("Failed to update local host"); }
  revalidatePath("/admin/local-hosts");
  return host;
}

export async function deleteLocalHost(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("local_hosts").delete().eq("id", id);
  if (error) { console.error("[deleteLocalHost]", error); throw new Error("Failed to delete local host"); }
  revalidatePath("/admin/local-hosts");
}

export async function getAllLocalHosts() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("local_hosts")
    .select("*, group:tour_groups(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllLocalHosts]", error); throw new Error("Failed to fetch local hosts"); }
  return data ?? [];
}

export async function getLocalHostForMyGroup(groupId: string) {
  const { db } = await requireVolunteerUser();
  const { data, error } = await db
    .from("local_hosts")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();
  if (error) { console.error("[getLocalHostForMyGroup]", error); throw new Error("Failed to fetch local host"); }
  return data;
}
