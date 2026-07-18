"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { registrationFeeSchema, type RegistrationFeeInput } from "@/lib/validations";
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

export async function getAllRegistrationFees() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("registration_fees")
    .select("*, volunteer:users!registration_fees_volunteer_id_fkey(id, name, email)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllRegistrationFees]", error); throw new Error("Failed to fetch registration fees"); }
  return data ?? [];
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
