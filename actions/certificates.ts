"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { certificateSchema, bulkCertificateSchema, type CertificateInput, type BulkCertificateInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const requireAdmin = requireAdminUser;

export async function issueCertificate(input: CertificateInput) {
  const { db, user } = await requireAdmin();
  const data = certificateSchema.parse(input);
  const { data: cert, error } = await db
    .from("certificates")
    .insert({ ...data, issued_by: user.id })
    .select()
    .single();
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  revalidatePath("/admin/certificates");
  return cert;
}

// One certificate per volunteer, of the single category chosen for the whole batch —
// state/place/volunteer_code are pulled from each volunteer's own ID card for this tour
// the same way the single-issue form does, so a volunteer with no card yet is skipped
// (they need a card issued first, same rule the single form enforces). Volunteers who
// already hold this exact category+tour combo are skipped too, so re-running the batch
// after adding a few stragglers doesn't double-issue everyone else.
export async function bulkIssueCertificates(input: BulkCertificateInput) {
  const { db, user } = await requireAdmin();
  const data = bulkCertificateSchema.parse(input);

  let existingQuery = db
    .from("certificates")
    .select("user_id")
    .eq("certificate_type", data.certificate_type)
    .in("user_id", data.volunteer_ids);
  existingQuery = data.tour_id ? existingQuery.eq("tour_id", data.tour_id) : existingQuery.is("tour_id", null);
  const { data: existing } = await existingQuery;
  const alreadyIssued = new Set((existing ?? []).map((r) => r.user_id));

  let issued = 0;
  const skippedNoIdCard: string[] = [];
  const failed: { volunteer_id: string; error: string }[] = [];
  for (const user_id of data.volunteer_ids) {
    if (alreadyIssued.has(user_id)) continue;
    try {
      let state: string | undefined;
      let place: string | undefined;
      let volunteer_code: string | undefined;
      if (data.tour_id) {
        const { data: card } = await db
          .from("id_cards")
          .select("state, place, card_number")
          .eq("volunteer_id", user_id)
          .eq("tour_id", data.tour_id)
          .order("issued_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!card) { skippedNoIdCard.push(user_id); continue; }
        state = card.state ?? undefined;
        place = card.place ?? undefined;
        volunteer_code = card.card_number;
      }
      const { error } = await db.from("certificates").insert({
        user_id,
        tour_id: data.tour_id,
        certificate_type: data.certificate_type,
        notes: data.notes,
        duration_of_visit: data.duration_of_visit,
        state,
        place,
        volunteer_code,
        issued_by: user.id,
      });
      if (error) throw new Error(error.message);
      issued++;
    } catch (err) {
      failed.push({ volunteer_id: user_id, error: err instanceof Error ? err.message : "Failed to issue certificate" });
    }
  }

  revalidatePath("/admin/certificates");
  return { issued, skipped: alreadyIssued.size, skippedNoIdCard, failed };
}

export async function revokeCertificate(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("certificates").delete().eq("id", id);
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  revalidatePath("/admin/certificates");
}

export async function getAllCertificates() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("certificates")
    .select("*, recipient:users!certificates_user_id_fkey(id, name, email), tours(id, title), issuer:users!certificates_issued_by_fkey(id, name)")
    .order("issued_at", { ascending: false });
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  return data ?? [];
}

export async function getMyCertificates() {
  const { db, user } = await getAuthenticatedUser();
  const { data, error } = await db
    .from("certificates")
    .select("*, tours(id, title, destination), issuer:users!certificates_issued_by_fkey(id, name)")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  return data ?? [];
}

export async function getCertificate(id: string) {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("certificates")
    .select("*, recipient:users!certificates_user_id_fkey(id, name, email), tours(id, title), issuer:users!certificates_issued_by_fkey(id, name)")
    .eq("id", id)
    .single();
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  return data;
}

export async function getMyCertificate(id: string) {
  const { db, user } = await getAuthenticatedUser();
  const { data, error } = await db
    .from("certificates")
    .select("*, recipient:users!certificates_user_id_fkey(id, name, email), tours(id, title), issuer:users!certificates_issued_by_fkey(id, name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) { console.error("[certificates]", error); throw new Error("Operation failed"); }
  return data;
}
