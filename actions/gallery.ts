"use server";

import { requireAdminUser } from "@/lib/clerk/action-auth";
import { revalidatePath } from "next/cache";

const requireAdmin = requireAdminUser;

export async function createCategory(name: string, description: string) {
  const { db } = await requireAdmin();

  const { data, error } = await db
    .from("gallery_categories")
    .insert({ name: name.trim(), description: description.trim() || null })
    .select()
    .single();

  if (error) { console.error("[createCategory]", error); throw new Error("Failed to create category"); }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");

  return data;
}

export async function deleteCategory(id: string) {
  const { db } = await requireAdmin();

  const { error } = await db
    .from("gallery_categories")
    .delete()
    .eq("id", id);

  if (error) { console.error("[deleteCategory]", error); throw new Error("Failed to delete category"); }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function addImage(
  categoryId: string,
  url: string,
  caption: string
) {
  const { db, user } = await requireAdmin();

  const trimmedUrl = url.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("Invalid image URL");
  }
  if (parsedUrl.protocol !== "https:") throw new Error("Image URL must use HTTPS");

  const { data, error } = await db
    .from("gallery_images")
    .insert({
      category_id: categoryId,
      url: trimmedUrl,
      caption: caption.trim() || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) { console.error("[addImage]", error); throw new Error("Failed to add image"); }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");

  return data;
}

export async function deleteImage(id: string) {
  const { db } = await requireAdmin();

  const { error } = await db
    .from("gallery_images")
    .delete()
    .eq("id", id);

  if (error) { console.error("[deleteImage]", error); throw new Error("Failed to delete image"); }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
