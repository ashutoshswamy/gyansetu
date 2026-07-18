"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { idCardSchema, type IdCardInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createIdCard(input: IdCardInput) {
  const { db, user } = await requireAdminUser();
  const data = idCardSchema.parse(input);
  const { data: card, error } = await db
    .from("id_cards")
    .insert({ ...data, issued_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createIdCard]", error); throw new Error("Failed to issue ID card"); }
  revalidatePath("/admin/id-cards");
  return card;
}

export async function deleteIdCard(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("id_cards").delete().eq("id", id);
  if (error) { console.error("[deleteIdCard]", error); throw new Error("Failed to delete ID card"); }
  revalidatePath("/admin/id-cards");
}

export async function getAllIdCards() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("id_cards")
    .select("*, volunteer:users!id_cards_volunteer_id_fkey(id, name, email)")
    .order("issued_at", { ascending: false });
  if (error) { console.error("[getAllIdCards]", error); throw new Error("Failed to fetch ID cards"); }
  return data ?? [];
}

export async function getMyIdCard() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("id_cards")
    .select("*")
    .eq("volunteer_id", user.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error("[getMyIdCard]", error); throw new Error("Failed to fetch ID card"); }
  return data;
}
