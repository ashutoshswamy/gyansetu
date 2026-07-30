"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { idCardSchema, bulkIdCardSchema, type IdCardInput, type BulkIdCardInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function destCode(destination: string) {
  return destination.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "TOUR";
}

function groupCode(groupName?: string | null) {
  if (!groupName) return "GEN";
  return groupName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1) || "GEN";
}

async function generateCardNumber(
  db: Awaited<ReturnType<typeof requireAdminUser>>["db"],
  tourId: string,
  groupId?: string
) {
  const { data: tour, error: tourError } = await db
    .from("tours")
    .select("destination, start_date")
    .eq("id", tourId)
    .single();
  if (tourError || !tour) throw new Error("Tour not found");

  let groupName: string | null = null;
  if (groupId) {
    const { data: group } = await db.from("tour_groups").select("name").eq("id", groupId).maybeSingle();
    groupName = group?.name ?? null;
  }

  let seqQuery = db.from("id_cards").select("id", { count: "exact", head: true }).eq("tour_id", tourId);
  seqQuery = groupId ? seqQuery.eq("group_id", groupId) : seqQuery.is("group_id", null);
  const { count } = await seqQuery;
  const seq = (count ?? 0) + 1;

  const year = String(new Date(tour.start_date).getFullYear()).slice(-2);
  return `GS-${destCode(tour.destination)}${year}-${groupCode(groupName)}-${String(seq).padStart(3, "0")}`;
}

export async function createIdCard(input: IdCardInput) {
  const { db, user } = await requireAdminUser();
  const data = idCardSchema.parse(input);
  const card_number = await generateCardNumber(db, data.tour_id, data.group_id);
  const { data: card, error } = await db
    .from("id_cards")
    .insert({ ...data, card_number, issued_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createIdCard]", error); throw new Error("Failed to issue ID card"); }
  revalidatePath("/admin/id-cards");
  return card;
}

// Issues one ID card per volunteer for the same tour/group/validity window — the
// per-volunteer id_cards insert loop stays sequential (not Promise.all) because
// generateCardNumber derives each card's sequence number from a count() query, and
// concurrent inserts would race on that count and hand out duplicate numbers.
// Volunteers who already hold a card for this exact tour+group are skipped rather
// than re-issued, so re-running the bulk action after adding a few stragglers is safe.
export async function bulkCreateIdCards(input: BulkIdCardInput) {
  const { db, user } = await requireAdminUser();
  const data = bulkIdCardSchema.parse(input);

  let existingQuery = db
    .from("id_cards")
    .select("volunteer_id")
    .eq("tour_id", data.tour_id)
    .in("volunteer_id", data.volunteer_ids);
  existingQuery = data.group_id ? existingQuery.eq("group_id", data.group_id) : existingQuery.is("group_id", null);
  const { data: existing } = await existingQuery;
  const alreadyIssued = new Set((existing ?? []).map((r) => r.volunteer_id));

  let issued = 0;
  const failed: { volunteer_id: string; error: string }[] = [];
  for (const volunteer_id of data.volunteer_ids) {
    if (alreadyIssued.has(volunteer_id)) continue;
    try {
      const card_number = await generateCardNumber(db, data.tour_id, data.group_id);
      const { error } = await db.from("id_cards").insert({
        volunteer_id,
        tour_id: data.tour_id,
        group_id: data.group_id,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        state: data.state,
        place: data.place,
        card_number,
        issued_by: user.id,
      });
      if (error) throw new Error(error.message);
      issued++;
    } catch (err) {
      failed.push({ volunteer_id, error: err instanceof Error ? err.message : "Failed to issue card" });
    }
  }

  revalidatePath("/admin/id-cards");
  return { issued, skipped: alreadyIssued.size, failed };
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
    .select("*, volunteer:users!id_cards_volunteer_id_fkey(id, name, email, volunteer_profiles!volunteer_profiles_user_id_fkey(photo_url)), tour:tours(id, title, destination), group:tour_groups(id, name)")
    .order("issued_at", { ascending: false });
  if (error) { console.error("[getAllIdCards]", error); throw new Error("Failed to fetch ID cards"); }
  return data ?? [];
}

export async function getIdCard(id: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("id_cards")
    .select("*, volunteer:users!id_cards_volunteer_id_fkey(id, name, email, volunteer_profiles!volunteer_profiles_user_id_fkey(photo_url)), tour:tours(id, title, destination), group:tour_groups(id, name)")
    .eq("id", id)
    .single();
  if (error) { console.error("[getIdCard]", error); throw new Error("Failed to fetch ID card"); }
  if (!data?.group_id) return data;
  const { data: member } = await db
    .from("tour_group_members")
    .select("role_in_group")
    .eq("group_id", data.group_id)
    .eq("user_id", data.volunteer_id)
    .maybeSingle();
  return { ...data, role_in_group: member?.role_in_group };
}

export async function getLatestIdCardForVolunteer(volunteerId: string, tourId?: string) {
  const { db } = await requireAdminUser();
  let query = db
    .from("id_cards")
    .select("card_number, state, place, valid_from, valid_to")
    .eq("volunteer_id", volunteerId);
  if (tourId) query = query.eq("tour_id", tourId);
  const { data, error } = await query.order("issued_at", { ascending: false }).limit(1).maybeSingle();
  if (error) { console.error("[getLatestIdCardForVolunteer]", error); throw new Error("Failed to fetch ID card"); }
  return data;
}

// getAuthenticatedUser (not requireVolunteerUser) — scoped to the caller's own id, and
// an enrollee demoted after their tour ended still needs to see the card they were
// issued on it. Optional tourId scopes to one specific past tour (for /enrollee/history);
// omitted, it defaults to the most recently issued card (unchanged /volunteer/id-card behavior).
export async function getMyIdCard(tourId?: string) {
  const { db, user } = await getAuthenticatedUser();
  let cardQuery = db
    .from("id_cards")
    .select("*, tour:tours(id, title, destination), group:tour_groups(id, name)")
    .eq("volunteer_id", user.id);
  if (tourId) cardQuery = cardQuery.eq("tour_id", tourId);

  const [{ data, error }, { data: profile }] = await Promise.all([
    cardQuery
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("users").select("name, volunteer_profiles!volunteer_profiles_user_id_fkey(photo_url)").eq("id", user.id).maybeSingle(),
  ]);
  if (error) { console.error("[getMyIdCard]", error); throw new Error("Failed to fetch ID card"); }
  if (!data) return data;
  let role_in_group: string | undefined;
  if (data.group_id) {
    const { data: member } = await db
      .from("tour_group_members")
      .select("role_in_group")
      .eq("group_id", data.group_id)
      .eq("user_id", user.id)
      .maybeSingle();
    role_in_group = member?.role_in_group;
  }
  return { ...data, role_in_group, name: profile?.name, photo_url: (profile as { volunteer_profiles?: { photo_url?: string } })?.volunteer_profiles?.photo_url };
}
