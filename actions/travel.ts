"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { travelTicketSchema, locationUpdateSchema, type TravelTicketInput, type LocationUpdateInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Ticket Management & Travel Planning

export async function createTravelTicket(input: TravelTicketInput) {
  const { db, user } = await requireAdminUser();
  const data = travelTicketSchema.parse(input);
  const { data: ticket, error } = await db
    .from("travel_tickets")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createTravelTicket]", error); throw new Error("Failed to create travel ticket"); }
  revalidatePath("/admin/travel");
  return ticket;
}

export async function updateTravelTicket(id: string, input: Partial<TravelTicketInput>) {
  const { db } = await requireAdminUser();
  const data = travelTicketSchema.partial().parse(input);
  const { data: ticket, error } = await db
    .from("travel_tickets")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateTravelTicket]", error); throw new Error("Failed to update travel ticket"); }
  revalidatePath("/admin/travel");
  revalidatePath("/volunteer/travel");
  return ticket;
}

export async function deleteTravelTicket(id: string) {
  const { db } = await requireAdminUser();
  const { error } = await db.from("travel_tickets").delete().eq("id", id);
  if (error) { console.error("[deleteTravelTicket]", error); throw new Error("Failed to delete travel ticket"); }
  revalidatePath("/admin/travel");
}

export async function getAllTravelTickets() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("travel_tickets")
    .select("*, group:tour_groups(id, name, tour_id)")
    .order("departure_at", { ascending: true });
  if (error) { console.error("[getAllTravelTickets]", error); throw new Error("Failed to fetch travel tickets"); }
  return data ?? [];
}

export async function getTravelTicketForMyGroup(groupId: string) {
  const { db } = await requireVolunteerUser();
  const { data, error } = await db
    .from("travel_tickets")
    .select("*")
    .eq("group_id", groupId)
    .order("departure_at", { ascending: true });
  if (error) { console.error("[getTravelTicketForMyGroup]", error); throw new Error("Failed to fetch travel tickets"); }
  return data ?? [];
}

// GPS / Location Updates

export async function postLocationUpdate(input: LocationUpdateInput) {
  const { db, user } = await requireVolunteerUser();
  const data = locationUpdateSchema.parse(input);
  const { data: update, error } = await db
    .from("location_updates")
    .insert({ ...data, posted_by: user.id })
    .select()
    .single();
  if (error) { console.error("[postLocationUpdate]", error); throw new Error("Failed to post location update"); }
  revalidatePath("/admin/travel");
  revalidatePath("/volunteer/travel");
  return update;
}

export async function getLocationUpdatesForGroup(groupId: string) {
  const { db } = await requireVolunteerUser();
  const { data, error } = await db
    .from("location_updates")
    .select("*, poster:users!location_updates_posted_by_fkey(id, name)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getLocationUpdatesForGroup]", error); throw new Error("Failed to fetch location updates"); }
  return data ?? [];
}
