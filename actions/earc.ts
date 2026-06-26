"use server";

import { requireAdminUser, requireEarcUser } from "@/lib/clerk/action-auth";
import { createServerClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revokeAllUserSessions } from "@/lib/clerk/revoke-sessions";
import { z } from "zod";

const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function createEarcStaff(formData: FormData) {
  await requireAdminUser();

  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { name, email, password } = parsed.data;
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";

  const clerk = await clerkClient();

  let clerkUser;
  try {
    clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      publicMetadata: { role: "earc_staff" },
    });
  } catch (err: any) {
    const clerkErr = err?.errors?.[0];
    if (clerkErr?.code === "form_identifier_exists") {
      // User already exists in Clerk — find them and promote to earc_staff
      const existing = await clerk.users.getUserList({ emailAddress: [email] });
      const existingUser = existing.data[0];
      if (!existingUser) throw new Error("Could not find existing user with that email.");

      await clerk.users.updateUserMetadata(existingUser.id, {
        publicMetadata: { role: "earc_staff" },
      });

      const db = createServerClient();
      await db.from("users").upsert(
        {
          clerk_id: existingUser.id,
          email,
          name: `${existingUser.firstName ?? ""} ${existingUser.lastName ?? ""}`.trim() || name.trim(),
          role: "earc_staff",
        },
        { onConflict: "clerk_id", ignoreDuplicates: false }
      );

      await revokeAllUserSessions(existingUser.id);
      return;
    }
    if (clerkErr?.code === "form_password_pwned") {
      throw new Error("Password is too common. Choose a stronger password.");
    }
    throw new Error(clerkErr?.message ?? "Failed to create account");
  }

  const db = createServerClient();
  await db.from("users").upsert(
    {
      clerk_id: clerkUser.id,
      email,
      name: name.trim(),
      role: "earc_staff",
    },
    { onConflict: "clerk_id", ignoreDuplicates: false }
  );
}

export async function deleteEarcStaff(clerkId: string) {
  await requireAdminUser();

  if (!clerkId || typeof clerkId !== "string") throw new Error("Invalid id");

  const clerk = await clerkClient();
  await clerk.users.deleteUser(clerkId);

  const db = createServerClient();
  await db.from("users").delete().eq("clerk_id", clerkId);
}

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

    await db.from("earc_files").insert({
      name,
      file_url: url,
      file_type: fileType,
      category,
      description: description?.trim() || null,
      uploaded_by: user.id,
    });
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

  await db.from("earc_files").insert({
    name: file.name,
    file_url: urlData.publicUrl,
    file_type: file.type,
    category,
    description: description?.trim() || null,
    uploaded_by: user.id,
  });
}

export async function deleteEarcFile(fileId: string) {
  await requireEarcUser();

  if (!fileId) throw new Error("Invalid id");

  const db = createServerClient();
  const { data } = await db
    .from("earc_files")
    .select("file_url")
    .eq("id", fileId)
    .maybeSingle();

  if (data?.file_url) {
    const path = data.file_url.split("/earc-files/")[1];
    if (path) await db.storage.from("earc-files").remove([path]);
  }

  await db.from("earc_files").delete().eq("id", fileId);
}
