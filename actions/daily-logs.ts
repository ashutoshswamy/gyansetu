"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { dailyLogSchema, type DailyLogInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const getUser = getAuthenticatedUser;
const requireAdmin = requireAdminUser;

export async function createDailyLog(input: DailyLogInput) {
  const { db, user } = await getUser();
  if (!["volunteer", "admin", "super_admin"].includes(user.role)) throw new Error("Only volunteers can submit daily logs");
  const data = dailyLogSchema.parse(input);
  const { data: log, error } = await db
    .from("daily_logs")
    .insert({ ...data, volunteer_id: user.id })
    .select()
    .single();
  if (error) { console.error("[createDailyLog]", error); throw new Error("Failed to create daily log"); }
  revalidatePath("/volunteer/daily-log");
  return log;
}

export async function updateDailyLog(id: string, input: Partial<DailyLogInput>) {
  const { db, user } = await getUser();
  const data = dailyLogSchema.partial().parse(input);
  const { data: log, error } = await db
    .from("daily_logs")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("volunteer_id", user.id)
    .select()
    .single();
  if (error) { console.error("[updateDailyLog]", error); throw new Error("Failed to update daily log"); }
  revalidatePath("/volunteer/daily-log");
  return log;
}

export async function deleteDailyLog(id: string) {
  const { db, user } = await getUser();
  const { error } = await db
    .from("daily_logs")
    .delete()
    .eq("id", id)
    .eq("volunteer_id", user.id);
  if (error) { console.error("[deleteDailyLog]", error); throw new Error("Failed to delete daily log"); }
  revalidatePath("/volunteer/daily-log");
}

export async function getMyDailyLogs(tourId?: string) {
  const { db, user } = await getUser();
  let query = db
    .from("daily_logs")
    .select("*, tours(id, title)")
    .eq("volunteer_id", user.id)
    .order("log_date", { ascending: false });
  if (tourId) query = query.eq("tour_id", tourId);
  const { data, error } = await query;
  if (error) { console.error("[getMyDailyLogs]", error); throw new Error("Failed to fetch daily logs"); }
  return data ?? [];
}

export async function getAllDailyLogs(tourId?: string) {
  const { db } = await requireAdmin();
  let query = db
    .from("daily_logs")
    .select("*, tours(id, title), users!daily_logs_volunteer_id_fkey(id, name, email)")
    .order("log_date", { ascending: false });
  if (tourId) query = query.eq("tour_id", tourId);
  const { data, error } = await query;
  if (error) { console.error("[getAllDailyLogs]", error); throw new Error("Failed to fetch daily logs"); }
  return data ?? [];
}

export async function getMediaByTour(tourId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const db = createServerClient();
  const { data, error } = await db
    .from("media_gallery")
    .select("*, users!media_gallery_uploaded_by_fkey(id, name)")
    .eq("tour_id", tourId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getMediaByTour]", error); throw new Error("Failed to fetch media"); }
  return data ?? [];
}

export async function uploadMedia(
  tourId: string,
  fileUrl: string,
  caption?: string,
  mediaType: "photo" | "document" | "video" = "photo"
) {
  const { db, user } = await getUser();
  if (!["volunteer", "admin", "super_admin"].includes(user.role)) throw new Error("Unauthorized");

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    throw new Error("Invalid file URL");
  }
  if (parsed.protocol !== "https:") throw new Error("File URL must use HTTPS");

  const { data, error } = await db
    .from("media_gallery")
    .insert({ tour_id: tourId, uploaded_by: user.id, file_url: fileUrl, caption, media_type: mediaType })
    .select()
    .single();
  if (error) { console.error("[uploadMedia]", error); throw new Error("Failed to upload media"); }
  revalidatePath(`/volunteer/media`);
  revalidatePath(`/admin/media`);
  return data;
}

export async function deleteMedia(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("media_gallery").delete().eq("id", id);
  if (error) { console.error("[deleteMedia]", error); throw new Error("Failed to delete media"); }
  revalidatePath("/admin/media");
}
