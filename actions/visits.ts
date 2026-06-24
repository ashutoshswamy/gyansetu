"use server";

import { requireAdminUser } from "@/lib/clerk/action-auth";
import { visitSchema, type VisitInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const requireAdmin = requireAdminUser;

export async function createVisit(input: unknown) {
  const { db, user } = await requireAdmin();
  const data = visitSchema.parse(input);

  const { data: visit, error } = await db
    .from("visits")
    .insert({
      title: data.title,
      destination: data.destination,
      state: data.state || null,
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description || null,
      timetable_url: data.timetable_url || null,
      status: data.status,
      capacity: data.capacity || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) { console.error("[createVisit]", error); throw new Error("Failed to create visit"); }

  revalidatePath("/visits");
  revalidatePath("/admin/visits");

  return visit;
}

export async function updateVisitStatus(
  id: string,
  status: "upcoming" | "ongoing" | "completed"
) {
  const { db } = await requireAdmin();

  const { data: visit, error } = await db
    .from("visits")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updateVisitStatus]", error); throw new Error("Failed to update visit"); }

  revalidatePath("/visits");
  revalidatePath("/admin/visits");

  return visit;
}

export async function deleteVisit(id: string) {
  const { db } = await requireAdmin();

  const { error } = await db.from("visits").delete().eq("id", id);
  if (error) { console.error("[deleteVisit]", error); throw new Error("Failed to delete visit"); }

  revalidatePath("/visits");
  revalidatePath("/admin/visits");
}

// Re-export type for callers that imported from here
export type { VisitInput };
