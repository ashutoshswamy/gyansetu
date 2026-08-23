"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { paymentSettingsSchema, type PaymentSettingsInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Singleton row: where volunteers should send the registration fee (UPI, bank details, QR code).
export async function getPaymentSettings() {
  const { db } = await getAuthenticatedUser();
  const { data, error } = await db.from("payment_settings").select("*").maybeSingle();
  if (error) { console.error("[getPaymentSettings]", error); throw new Error("Failed to fetch payment details"); }
  return data;
}

export async function upsertPaymentSettings(input: PaymentSettingsInput) {
  const { db, user } = await requireAdminUser();
  const data = paymentSettingsSchema.parse(input);

  const { data: existing } = await db.from("payment_settings").select("id").maybeSingle();

  const { data: settings, error } = existing
    ? await db.from("payment_settings").update({ ...data, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single()
    : await db.from("payment_settings").insert({ ...data, updated_by: user.id }).select().single();
  if (error) { console.error("[upsertPaymentSettings]", error); throw new Error("Failed to save payment details"); }

  revalidatePath("/admin/registration-fees");
  revalidatePath("/volunteer/registration-fee");
  return settings;
}
