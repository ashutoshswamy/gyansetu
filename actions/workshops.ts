"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { workshopSchema, workshopAttendeeSchema, type WorkshopInput, type WorkshopAttendeeInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createWorkshop(input: WorkshopInput) {
  const { db, user } = await requireAdminUser();
  const data = workshopSchema.parse(input);
  const { data: workshop, error } = await db
    .from("workshops")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createWorkshop]", error); throw new Error("Failed to create workshop"); }
  revalidatePath("/admin/workshops");
  return workshop;
}

export async function updateWorkshop(id: string, input: Partial<WorkshopInput>) {
  const { db } = await requireAdminUser();
  const data = workshopSchema.partial().parse(input);
  const { data: workshop, error } = await db
    .from("workshops")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateWorkshop]", error); throw new Error("Failed to update workshop"); }
  revalidatePath("/admin/workshops");
  revalidatePath("/volunteer/workshops");
  return workshop;
}

export async function deleteWorkshop(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("workshops").delete().eq("id", id);
  if (error) { console.error("[deleteWorkshop]", error); throw new Error("Failed to delete workshop"); }
  revalidatePath("/admin/workshops");
}

export async function getAllWorkshops() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("workshops")
    .select("*, trainer:users!workshops_trainer_id_fkey(id, name, email)")
    .order("workshop_date", { ascending: true });
  if (error) { console.error("[getAllWorkshops]", error); throw new Error("Failed to fetch workshops"); }
  return data ?? [];
}

export async function getUpcomingWorkshops() {
  const { db } = await requireVolunteerUser();
  const { data, error } = await db
    .from("workshops")
    .select("*, trainer:users!workshops_trainer_id_fkey(id, name)")
    .order("workshop_date", { ascending: true });
  if (error) { console.error("[getUpcomingWorkshops]", error); throw new Error("Failed to fetch workshops"); }
  return data ?? [];
}

// Attendance

export async function setWorkshopAttendance(input: WorkshopAttendeeInput) {
  const { db } = await requireAdminUser();
  const data = workshopAttendeeSchema.parse(input);
  const { data: row, error } = await db
    .from("workshop_attendees")
    .upsert(data, { onConflict: "workshop_id,volunteer_id" })
    .select()
    .single();
  if (error) { console.error("[setWorkshopAttendance]", error); throw new Error("Failed to set attendance"); }
  revalidatePath("/admin/workshops");
  return row;
}

export async function getWorkshopAttendees(workshopId: string) {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("workshop_attendees")
    .select("*, volunteer:users!workshop_attendees_volunteer_id_fkey(id, name, email)")
    .eq("workshop_id", workshopId);
  if (error) { console.error("[getWorkshopAttendees]", error); throw new Error("Failed to fetch attendees"); }
  return data ?? [];
}

export async function submitMissedWorkshopSummary(workshopId: string, summary: string) {
  const { db, user } = await requireVolunteerUser();
  const data = workshopAttendeeSchema.parse({
    workshop_id: workshopId,
    volunteer_id: user.id,
    attendance_status: "excused",
    missed_summary: summary,
    makeup_decision: "pending",
  });
  const { data: row, error } = await db
    .from("workshop_attendees")
    .upsert(data, { onConflict: "workshop_id,volunteer_id" })
    .select()
    .single();
  if (error) { console.error("[submitMissedWorkshopSummary]", error); throw new Error("Failed to submit summary"); }
  revalidatePath("/volunteer/workshops");
  return row;
}

const decideMakeupSchema = z.object({
  workshop_id: z.string().uuid(),
  volunteer_id: z.string().uuid(),
  decision: z.enum(["allowed", "not_allowed"]),
});

export async function decideMakeup(workshopId: string, volunteerId: string, decision: "allowed" | "not_allowed") {
  const { db } = await requireAdminUser();
  const parsed = decideMakeupSchema.parse({ workshop_id: workshopId, volunteer_id: volunteerId, decision });
  const { data, error } = await db
    .from("workshop_attendees")
    .update({ makeup_decision: parsed.decision })
    .eq("workshop_id", parsed.workshop_id)
    .eq("volunteer_id", parsed.volunteer_id)
    .select()
    .single();
  if (error) { console.error("[decideMakeup]", error); throw new Error("Failed to record decision"); }
  revalidatePath("/admin/workshops");
  return data;
}

export async function getMyWorkshopAttendance() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("workshop_attendees")
    .select("*, workshop:workshops(id, title, workshop_type, workshop_date)")
    .eq("volunteer_id", user.id);
  if (error) { console.error("[getMyWorkshopAttendance]", error); throw new Error("Failed to fetch attendance"); }
  return data ?? [];
}
