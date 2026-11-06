"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireVolunteerUser } from "@/lib/clerk/action-auth";

export async function getMyShareLink() {
  const { db, user } = await requireVolunteerUser();
  const { data } = await db
    .from("parent_share_links")
    .select("token, tour_id")
    .eq("volunteer_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getMyShareTours() {
  const { db, user } = await requireVolunteerUser();
  const { data } = await db
    .from("volunteer_assignments")
    .select("tours(id, title)")
    .eq("volunteer_id", user.id);
  return (data ?? []).flatMap((r) => (r.tours ? [r.tours as unknown as { id: string; title: string }] : []));
}

// Revokes any live link, then issues a fresh one — also serves as "regenerate".
export async function createShareLink(tourId?: string | null) {
  const { db, user } = await requireVolunteerUser();
  if (tourId) {
    const { data: ok } = await db
      .from("volunteer_assignments")
      .select("id")
      .eq("volunteer_id", user.id)
      .eq("tour_id", tourId)
      .maybeSingle();
    if (!ok) throw new Error("Not assigned to that tour");
  }
  await db
    .from("parent_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("volunteer_id", user.id)
    .is("revoked_at", null);
  const token = randomBytes(24).toString("base64url");
  const { error } = await db.from("parent_share_links").insert({ volunteer_id: user.id, token, tour_id: tourId || null });
  if (error) { console.error("[createShareLink]", error); throw new Error("Failed to create link"); }
  revalidatePath("/volunteer/share");
  return { token, tour_id: tourId || null };
}

export async function revokeShareLink() {
  const { db, user } = await requireVolunteerUser();
  const { error } = await db
    .from("parent_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("volunteer_id", user.id)
    .is("revoked_at", null);
  if (error) { console.error("[revokeShareLink]", error); throw new Error("Failed to revoke link"); }
  revalidatePath("/volunteer/share");
}
