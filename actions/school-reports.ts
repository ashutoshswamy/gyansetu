"use server";

import { requireVolunteerUser, assertGroupAccess } from "@/lib/clerk/action-auth";
import { schoolReportSchema, type SchoolReportInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function submitSchoolReport(input: SchoolReportInput) {
  const { db, user } = await requireVolunteerUser();
  const data = schoolReportSchema.parse(input);
  await assertGroupAccess(db, user, data.group_id);
  const { data: report, error } = await db
    .from("school_reports")
    .insert({ ...data, submitted_by: user.id })
    .select()
    .single();
  if (error) { console.error("[submitSchoolReport]", error); throw new Error("Failed to submit school report"); }
  revalidatePath("/volunteer/school-reports");
  return report;
}

export async function updateSchoolReport(id: string, input: Partial<SchoolReportInput>) {
  const { db, user } = await requireVolunteerUser();
  const data = schoolReportSchema.partial().parse(input);
  const { data: report, error } = await db
    .from("school_reports")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("submitted_by", user.id)
    .select()
    .single();
  if (error) { console.error("[updateSchoolReport]", error); throw new Error("Failed to update school report"); }
  revalidatePath("/volunteer/school-reports");
  return report;
}

export async function getGroupSchoolReports(groupId: string) {
  const { db, user } = await requireVolunteerUser();
  await assertGroupAccess(db, user, groupId);
  const { data, error } = await db
    .from("school_reports")
    .select("*, submitter:users!school_reports_submitted_by_fkey(id, name)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getGroupSchoolReports]", error); throw new Error("Failed to fetch school reports"); }
  return data ?? [];
}

export async function getGroupMembersForSchoolReport(groupId: string) {
  const { db, user } = await requireVolunteerUser();
  await assertGroupAccess(db, user, groupId);
  const { data, error } = await db
    .from("tour_group_members")
    .select("users(id, name)")
    .eq("group_id", groupId);
  if (error) { console.error("[getGroupMembersForSchoolReport]", error); throw new Error("Failed to fetch group members"); }
  return ((data ?? []) as unknown as { users: { id: string; name: string } | null }[])
    .map(m => m.users)
    .filter((u): u is { id: string; name: string } => !!u);
}
