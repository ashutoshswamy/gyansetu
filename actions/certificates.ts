"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { certificateSchema, type CertificateInput } from "@/lib/validations";
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
