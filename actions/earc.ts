"use server";

import { requireEarcUser, requireAdminUser } from "@/lib/clerk/action-auth";
import { earcSchoolProfileSchema, earcStudentProfileSchema, type EarcSchoolProfileInput, type EarcStudentProfileInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function durationHours(duration: string): number {
  return Number(duration.replace(/[^0-9.]/g, "")) || 0;
}

export async function createSchoolProfile(input: EarcSchoolProfileInput) {
  const { db, user } = await requireEarcUser();
  const data = earcSchoolProfileSchema.parse(input);

  const total_students = data.student_strength.reduce((sum, row) => sum + row.boys + row.girls, 0);
  const total_input_hours = durationHours(data.duration_per_session) * data.num_sessions_conducted;

  const { data: profile, error } = await db
    .from("earc_school_profiles")
    .insert({ ...data, total_students, total_input_hours, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createSchoolProfile]", error); throw new Error("Failed to save school profile"); }
  revalidatePath("/earc/school-profile");
  return profile;
}

export async function getSchoolProfiles() {
  const { db } = await requireEarcUser();
  const { data, error } = await db
    .from("earc_school_profiles")
    .select("*, submitter:users!earc_school_profiles_created_by_fkey(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getSchoolProfiles]", error); throw new Error("Failed to fetch school profiles"); }
  return data ?? [];
}

export async function createStudentProfile(input: EarcStudentProfileInput) {
  const { db, user } = await requireEarcUser();
  const data = earcStudentProfileSchema.parse(input);

  const { data: profile, error } = await db
    .from("earc_students")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) { console.error("[createStudentProfile]", error); throw new Error("Failed to save student profile"); }
  revalidatePath("/earc/student-profile");
  return profile;
}

export async function getStudentProfiles() {
  const { db } = await requireEarcUser();
  const { data, error } = await db
    .from("earc_students")
    .select("*, submitter:users!earc_students_created_by_fkey(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getStudentProfiles]", error); throw new Error("Failed to fetch student profiles"); }
  return data ?? [];
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const body = rows.map(r => columns.map(c => escape(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export async function exportSchoolProfilesCsv() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("earc_school_profiles")
    .select("*, submitter:users!earc_school_profiles_created_by_fkey(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[exportSchoolProfilesCsv]", error); throw new Error("Failed to export school profiles"); }

  const rows = (data ?? []).map(r => ({
    ...r,
    student_strength: JSON.stringify(r.student_strength ?? []),
    submitted_by: (r.submitter as { name?: string } | null)?.name ?? "",
  }));

  const columns = [
    "id", "academic_year", "project", "school_name", "state", "district", "taluka_block", "village_city",
    "school_type", "module", "mode", "contact_number", "student_strength", "num_teachers_involved",
    "location_type", "medium_of_instruction", "duration_per_session", "num_sessions_conducted",
    "total_input_hours", "total_students", "submitted_by", "created_at",
  ];

  return toCsv(rows, columns);
}

export async function exportStudentProfilesCsv() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("earc_students")
    .select("*, submitter:users!earc_students_created_by_fkey(id, name)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[exportStudentProfilesCsv]", error); throw new Error("Failed to export student profiles"); }

  const rows = (data ?? []).map(r => ({
    ...r,
    submitted_by: (r.submitter as { name?: string } | null)?.name ?? "",
  }));

  const columns = [
    "id", "first_name", "middle_name", "last_name", "mobile_number", "date_of_birth", "gender",
    "blood_group", "apaar_id", "aadhaar_number", "submitted_by", "created_at",
  ];

  return toCsv(rows, columns);
}
