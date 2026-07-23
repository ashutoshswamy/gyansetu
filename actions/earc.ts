"use server";

import { requireEarcUser } from "@/lib/clerk/action-auth";

const ALLOWED_EARC_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type EarcFileCategory = "student_data" | "programme_data" | "document";

export async function uploadEarcFile(
  formData: FormData,
  category: EarcFileCategory
): Promise<void> {
  const { db, user } = await requireEarcUser();

  const directUrl = formData.get("file_url") as string | null;
  const description = formData.get("description") as string | null;

  if (directUrl && directUrl.trim()) {
    const url = directUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error("Invalid file URL. Must start with http:// or https://");
    }
    const name = url.split("/").pop() || "linked-file";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    let fileType = "application/octet-stream";
    if (ext === "pdf") fileType = "application/pdf";
    else if (ext === "doc") fileType = "application/msword";
    else if (ext === "docx") fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "xls") fileType = "application/vnd.ms-excel";
    else if (ext === "xlsx") fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "csv") fileType = "text/csv";
    else if (ext === "jpg" || ext === "jpeg") fileType = "image/jpeg";
    else if (ext === "png") fileType = "image/png";
    else if (ext === "webp") fileType = "image/webp";

    const { error } = await db.from("earc_files").insert({
      name,
      file_url: url,
      file_type: fileType,
      category,
      description: description?.trim() || null,
      uploaded_by: user.id,
    });
    if (error) { console.error("[uploadEarcFile]", error); throw new Error("Failed to save file record"); }
    return;
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file or direct link provided");
  if (file.size > 20 * 1024 * 1024) throw new Error("File exceeds 20 MB");
  if (!ALLOWED_EARC_MIME_TYPES.has(file.type)) throw new Error("File type not allowed");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `earc/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from("earc-files")
    .upload(safeName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error("Upload failed");

  const { data: urlData } = db.storage.from("earc-files").getPublicUrl(safeName);

  const { error } = await db.from("earc_files").insert({
    name: file.name,
    file_url: urlData.publicUrl,
    file_type: file.type,
    category,
    description: description?.trim() || null,
    uploaded_by: user.id,
  });
  if (error) { console.error("[uploadEarcFile]", error); throw new Error("Failed to save file record"); }
}

export async function deleteEarcFile(fileId: string) {
  const { db, user } = await requireEarcUser();

  if (!fileId) throw new Error("Invalid id");

  const { data } = await db
    .from("earc_files")
    .select("file_url, uploaded_by")
    .eq("id", fileId)
    .maybeSingle();

  if (!data) throw new Error("File not found");
  if (data.uploaded_by !== user.id && user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("You can only delete files you uploaded");
  }

  if (data.file_url) {
    const path = data.file_url.split("/earc-files/")[1];
    if (path) await db.storage.from("earc-files").remove([path]);
  }

  await db.from("earc_files").delete().eq("id", fileId);
}
