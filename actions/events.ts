"use server";

import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { eventSchema, type EventInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const requireAdmin = requireAdminUser;
const getUser = getAuthenticatedUser;

export async function createEvent(input: EventInput) {
  const { db, user } = await requireAdmin();
  const data = eventSchema.parse(input);
  const { data: event, error } = await db
    .from("events")
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createEvent]", error); throw new Error("Failed to create event"); }
  revalidatePath("/admin/events");
  return event;
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const { db } = await requireAdmin();
  const data = eventSchema.partial().parse(input);
  const { data: event, error } = await db
    .from("events")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateEvent]", error); throw new Error("Failed to update event"); }
  revalidatePath("/admin/events");
  return event;
}

export async function deleteEvent(id: string) {
  const { db } = await requireAdmin();
  const { error } = await db.from("events").delete().eq("id", id);
  if (error) { console.error("[deleteEvent]", error); throw new Error("Failed to delete event"); }
  revalidatePath("/admin/events");
}

export async function getEvents(filters?: { tour_id?: string; event_type?: string }) {
  const { db } = await getAuthenticatedUser();
  let query = db.from("events").select("*, tours(id, title)").order("event_date", { ascending: true });
  if (filters?.tour_id) query = query.eq("tour_id", filters.tour_id);
  if (filters?.event_type) query = query.eq("event_type", filters.event_type);
  const { data, error } = await query;
  if (error) { console.error("[getEvents]", error); throw new Error("Failed to fetch events"); }
  return data ?? [];
}

export async function rsvpEvent(eventId: string, status: "confirmed" | "maybe" | "absent") {
  const { db, user } = await getUser();
  const { error } = await db
    .from("event_attendees")
    .upsert({ event_id: eventId, user_id: user.id, rsvp_status: status }, { onConflict: "event_id,user_id" });
  if (error) { console.error("[rsvpEvent]", error); throw new Error("Failed to update RSVP"); }
  revalidatePath("/volunteer/events");
}

export async function getMyEventRsvps() {
  const { db, user } = await getUser();
  const { data, error } = await db
    .from("event_attendees")
    .select("*")
    .eq("user_id", user.id);
  if (error) { console.error("[getMyEventRsvps]", error); throw new Error("Failed to fetch RSVPs"); }
  return data ?? [];
}

export async function markAttended(eventId: string, userId: string) {
  const { db } = await requireAdmin();
  const { error } = await db
    .from("event_attendees")
    .upsert({ event_id: eventId, user_id: userId, rsvp_status: "attended" }, { onConflict: "event_id,user_id" });
  if (error) { console.error("[markAttended]", error); throw new Error("Failed to mark attendance"); }
  revalidatePath("/admin/events");
}
