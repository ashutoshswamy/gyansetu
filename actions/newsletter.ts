"use server";

import { requireAdminUser } from "@/lib/clerk/action-auth";
import { newsletterSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const getAdminUser = requireAdminUser;

export async function createNewsletter(input: unknown) {
  const { db, user } = await getAdminUser();
  const data = newsletterSchema.parse(input);

  const insertData: Record<string, unknown> = {
    title: data.title,
    description: data.description || null,
    file_url: data.file_url || null,
    issue_number: data.issue_number || null,
    status: data.status,
    created_by: user.id,
  };

  if (data.status === "published") {
    insertData.published_at = new Date().toISOString();
  }

  const { data: newsletter, error } = await db
    .from("newsletters")
    .insert(insertData)
    .select()
    .single();

  if (error) { console.error("[createNewsletter]", error); throw new Error("Failed to create newsletter"); }

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");

  return newsletter;
}

export async function publishNewsletter(id: string) {
  const { db } = await getAdminUser();

  const { error } = await db
    .from("newsletters")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) { console.error("[publishNewsletter]", error); throw new Error("Failed to publish newsletter"); }

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
}

export async function deleteNewsletter(id: string) {
  const { db } = await getAdminUser();

  const { error } = await db.from("newsletters").delete().eq("id", id);
  if (error) { console.error("[deleteNewsletter]", error); throw new Error("Failed to delete newsletter"); }

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
}
