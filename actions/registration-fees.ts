"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { registrationFeeSchema, volunteerRegistrationFeeSchema, rejectRegistrationFeeSchema, type RegistrationFeeInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";
import { ZodError } from "zod";

function describeZodError(err: ZodError): string {
  const first = err.issues[0];
  if (!first) return "Invalid input";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

export async function createRegistrationFee(input: RegistrationFeeInput) {
  const { db } = await requireAdminUser();
  const data = registrationFeeSchema.parse(input);
  const { data: fee, error } = await db
    .from("registration_fees")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("[createRegistrationFee]", error); throw new Error("Failed to create registration fee"); }
  revalidatePath("/admin/registration-fees");
  return fee;
}

export async function updateRegistrationFee(id: string, input: Partial<RegistrationFeeInput>) {
  const { db } = await requireAdminUser();
  const data = registrationFeeSchema.partial().parse(input);
  const { data: fee, error } = await db
    .from("registration_fees")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateRegistrationFee]", error); throw new Error("Failed to update registration fee"); }
  revalidatePath("/admin/registration-fees");
  revalidatePath("/volunteer/profile");
  return fee;
}

// Admin verifies a volunteer-submitted payment (or marks a pending fee paid directly).
export async function verifyRegistrationFee(id: string) {
  const { db, user } = await requireAdminUser();
  const { data: fee, error } = await db
    .from("registration_fees")
    .update({ status: "paid", paid_at: new Date().toISOString(), verified_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[verifyRegistrationFee]", error); throw new Error("Failed to verify payment"); }
  revalidatePath("/admin/registration-fees");
  revalidatePath("/volunteer/registration-fee");
  return fee;
}

// Admin rejects a volunteer-submitted payment with a reason; volunteer sees it and can resubmit.
export async function rejectRegistrationFee(id: string, reason: string) {
  const { db, user } = await requireAdminUser();
  let parsedReason: string;
  try {
    parsedReason = rejectRegistrationFeeSchema.parse({ reason }).reason;
  } catch (err) {
    if (err instanceof ZodError) return { ok: false as const, error: describeZodError(err) };
    throw err;
  }

  const { data: fee, error } = await db
    .from("registration_fees")
    .update({ status: "rejected", rejection_reason: parsedReason, verified_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, volunteer_id")
    .single();
  if (error) { console.error("[rejectRegistrationFee]", error); return { ok: false as const, error: "Failed to reject payment" }; }

  if (fee.volunteer_id) {
    await createNotification({
      user_id: fee.volunteer_id,
      title: "Registration fee payment rejected",
      message: `Your registration fee payment was rejected: ${parsedReason}. Please resubmit.`,
      type: "error",
    }).catch(err => console.error("[rejectRegistrationFee notify]", err));
  }

  revalidatePath("/admin/registration-fees");
  revalidatePath("/volunteer/registration-fee");
  return { ok: true as const, fee };
}

// Admin refunds a paid fee, with an optional note for the record.
export async function refundRegistrationFee(id: string, reason?: string) {
  const { db, user } = await requireAdminUser();

  const { data: fee, error } = await db
    .from("registration_fees")
    .update({ status: "refunded", refund_reason: reason?.trim() || null, verified_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid")
    .select("*, volunteer_id")
    .single();
  if (error || !fee) { console.error("[refundRegistrationFee]", error); return { ok: false as const, error: "Failed to refund fee" }; }

  if (fee.volunteer_id) {
    await createNotification({
      user_id: fee.volunteer_id,
      title: "Registration fee refunded",
      message: reason ? `Your registration fee has been refunded: ${reason}` : "Your registration fee has been refunded.",
      type: "info",
    }).catch(err => console.error("[refundRegistrationFee notify]", err));
  }

  revalidatePath("/admin/registration-fees");
  revalidatePath("/volunteer/registration-fee");
  return { ok: true as const, fee };
}

export async function getAllRegistrationFees() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("registration_fees")
    .select("*, volunteer:users!registration_fees_volunteer_id_fkey(id, name, email), tour:tours(id, title), group:tour_groups(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllRegistrationFees]", error); throw new Error("Failed to fetch registration fees"); }
  return data ?? [];
}

export async function getMyRegistrationFee() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("registration_fees")
    .select("*, tour:tours(id, title), group:tour_groups(id, name)")
    .eq("volunteer_id", user.id)
    .maybeSingle();
  if (error) { console.error("[getMyRegistrationFee]", error); throw new Error("Failed to fetch registration fee"); }
  return data;
}

// Volunteer records their own registration fee payment: tour/group are
// auto-fetched from the caller's (most recent) group membership rather than
// picked, amount + transaction id + remarks are entered. Creates the row if
// none exists yet; if admin already created a "pending" placeholder (amount
// set but no payment info), fills it in instead of erroring. Blocked once the
// fee has moved past pending/submitted (already settled).
export async function submitRegistrationFee(input: { amount: number; payment_reference: string; notes?: string }) {
  const { db, user } = await requireVolunteerUser();
  const data = volunteerRegistrationFeeSchema.parse(input);

  const { data: membership } = await db
    .from("tour_group_members")
    .select("group_id, tour_groups!inner(tour_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const tourGroup = membership?.tour_groups as unknown as { tour_id: string } | null;

  const { data: existing, error: fetchError } = await db
    .from("registration_fees")
    .select("id, status")
    .eq("volunteer_id", user.id)
    .maybeSingle();
  if (fetchError) { console.error("[submitRegistrationFee]", fetchError); throw new Error("Failed to record payment"); }
  if (existing && existing.status !== "pending" && existing.status !== "rejected") throw new Error("Registration fee already recorded");

  const payload = {
    volunteer_id: user.id,
    amount: data.amount,
    payment_reference: data.payment_reference,
    notes: data.notes ?? null,
    tour_id: tourGroup?.tour_id ?? null,
    group_id: membership?.group_id ?? null,
    status: "submitted" as const,
    submitted_at: new Date().toISOString(),
    rejection_reason: null,
  };

  const { data: fee, error } = existing
    ? await db.from("registration_fees").update(payload).eq("id", existing.id).select().single()
    : await db.from("registration_fees").insert(payload).select().single();
  if (error) { console.error("[submitRegistrationFee]", error); throw new Error("Failed to record payment"); }

  revalidatePath("/volunteer/registration-fee");
  revalidatePath("/admin/registration-fees");
  return fee;
}
