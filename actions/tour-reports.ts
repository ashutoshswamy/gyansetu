"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { tourReportSchema, type TourReportInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function submitTourReport(input: TourReportInput) {
  const { db, user } = await requireVolunteerUser();
  const data = tourReportSchema.parse(input);
  const { data: report, error } = await db
    .from("tour_reports")
    .insert({ ...data, submitted_by: user.id })
    .select()
    .single();
  if (error) { console.error("[submitTourReport]", error); throw new Error("Failed to submit tour report"); }
  revalidatePath("/admin/tour-reports");
  revalidatePath("/volunteer/tour-report");
  return report;
}

export async function updateTourReport(id: string, input: Partial<TourReportInput>) {
  const { db, user } = await requireVolunteerUser();
  const data = tourReportSchema.partial().parse(input);
  const { data: report, error } = await db
    .from("tour_reports")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("submitted_by", user.id)
    .select()
    .single();
  if (error) { console.error("[updateTourReport]", error); throw new Error("Failed to update tour report"); }
  revalidatePath("/admin/tour-reports");
  revalidatePath("/volunteer/tour-report");
  return report;
}

export async function approveTourReport(id: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("tour_reports")
    .update({ status: "approved" })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[approveTourReport]", error); throw new Error("Failed to approve tour report"); }
  revalidatePath("/admin/tour-reports");
  return data;
}

export async function getAllTourReports() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("tour_reports")
    .select("*, tour:tours(id, title), group:tour_groups(id, name), submitter:users!tour_reports_submitted_by_fkey(id, name, email)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllTourReports]", error); throw new Error("Failed to fetch tour reports"); }
  return data ?? [];
}

export async function getMyTourReports() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("tour_reports")
    .select("*, tour:tours(id, title)")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getMyTourReports]", error); throw new Error("Failed to fetch tour reports"); }
  return data ?? [];
}
