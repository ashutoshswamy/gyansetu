"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { createServerClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = ["blog-covers", "newsletter-files", "gallery-images", "media"] as const;

// "media" is uploaded by any logged-in role (student/volunteer/admin); others are admin-only.
const OPEN_BUCKETS = new Set(["media"]);

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "blog-covers":      ["jpg", "jpeg", "png", "webp", "gif"],
  "gallery-images":   ["jpg", "jpeg", "png", "webp", "gif"],
  "newsletter-files": ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"],
  "media":            ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "ogg"],
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4", "video/webm", "video/quicktime", "video/ogg",
]);

export async function uploadFileToStorage(
  formData: FormData,
  bucket: string,
  folder: string
): Promise<string> {
  if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error("Invalid storage bucket");
  }

  if (OPEN_BUCKETS.has(bucket)) {
    await getAuthenticatedUser();
  } else {
    await requireAdminUser();
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) throw new Error("File exceeds 10 MB limit");

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("File type not allowed");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ALLOWED_EXTENSIONS[bucket] ?? [];
  if (!allowedExts.includes(ext)) {
    throw new Error(`File extension .${ext} not allowed for this bucket`);
  }

  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const db = createServerClient();

  const { error } = await db.storage.from(bucket).upload(safeName, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) { console.error("[uploadFileToStorage]", error); throw new Error("Upload failed"); }

  const { data } = db.storage.from(bucket).getPublicUrl(safeName);
  return data.publicUrl;
}
