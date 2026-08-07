"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { registrationFeeSchema, paymentSubmissionSchema, type RegistrationFeeInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

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

export async function getAllRegistrationFees() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("registration_fees")
    .select("*, volunteer:users!registration_fees_volunteer_id_fkey(id, name, email)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllRegistrationFees]", error); throw new Error("Failed to fetch registration fees"); }
  return data ?? [];
}

// Volunteer reports having paid: records the transaction id and moves the fee
// into "submitted" so admin can verify it. Only allowed while pending/submitted
// (i.e. not already paid/waived/refunded) and only on the caller's own row.
export async function submitPaymentReference(input: { payment_reference: string }) {
  const { db, user } = await requireVolunteerUser();
  const { payment_reference } = paymentSubmissionSchema.parse(input);

  const { data: existing, error: fetchError } = await db
    .from("registration_fees")
    .select("id, status")
    .eq("volunteer_id", user.id)
    .maybeSingle();
  if (fetchError) { console.error("[submitPaymentReference]", fetchError); throw new Error("Failed to submit payment"); }
  if (!existing) throw new Error("No registration fee record found");
  if (existing.status === "paid" || existing.status === "waived" || existing.status === "refunded") {
    throw new Error("This fee is already settled");
  }

  const { data: fee, error } = await db
    .from("registration_fees")
    .update({ status: "submitted", payment_reference, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select()
    .single();
  if (error) { console.error("[submitPaymentReference]", error); throw new Error("Failed to submit payment"); }

  revalidatePath("/volunteer/registration-fee");
  revalidatePath("/admin/registration-fees");
  return fee;
}

export async function getMyRegistrationFee() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("registration_fees")
    .select("*")
    .eq("volunteer_id", user.id)
    .maybeSingle();
  if (error) { console.error("[getMyRegistrationFee]", error); throw new Error("Failed to fetch registration fee"); }
  return data;
}
