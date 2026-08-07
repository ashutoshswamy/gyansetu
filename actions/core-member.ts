"use server";

import { requireCoreMemberUser, assertCoreMemberOverVolunteer } from "@/lib/clerk/action-auth";
import { totalOf } from "@/lib/demo-evaluation-utils";
import { demoEvaluationSchema, volunteerObservationSchema, type DemoEvaluationInput, type VolunteerObservationInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = ["admin", "super_admin"];

// Everything a core member is allowed to see about one volunteer in their group, in a
// single round trip. Every query here is a direct pattern-match of the volunteer's own
// "getMyX" action, just scoped to the target volunteer instead of the caller.
export async function getVolunteerDetailForCoreMember(groupId: string, volunteerId: string) {
  const { db, user } = await requireCoreMemberUser();
  await assertCoreMemberOverVolunteer(db, user, groupId, volunteerId);

  const { data: group } = await db.from("tour_groups").select("tour_id").eq("id", groupId).maybeSingle();
  const tourId = group?.tour_id ?? null;

  const [
    { data: registrationFee },
    { data: workshopAttendance },
    { data: formSubmissions },
    { data: eventRsvps },
    { data: demoEvaluations },
    { data: dailyLogs },
    { data: schoolReports },
    { data: travelTickets },
    { data: expenses },
    { data: tourReports },
    { data: media },
    { data: observations },
  ] = await Promise.all([
    db.from("registration_fees").select("*").eq("volunteer_id", volunteerId).maybeSingle(),
    db.from("workshop_attendees").select("*, workshop:workshops(id, title, workshop_type, workshop_date)").eq("volunteer_id", volunteerId),
    db.from("form_submissions").select("*, dynamic_forms!inner(id, title, tour_id)").eq("submitted_by", volunteerId).order("submitted_at", { ascending: false }),
    db.from("event_attendees").select("*, event:events(id, title, event_type, event_date)").eq("user_id", volunteerId),
    db.from("demo_evaluations").select("*, tour:tours(id, title)").eq("volunteer_id", volunteerId).order("evaluated_at", { ascending: false }),
    tourId
      ? db.from("daily_logs").select("*").eq("volunteer_id", volunteerId).eq("tour_id", tourId).order("log_date", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    db.from("school_reports").select("*, submitter:users!school_reports_submitted_by_fkey(id, name)").eq("group_id", groupId).order("created_at", { ascending: false }),
    db.from("travel_tickets").select("*").eq("group_id", groupId).order("departure_at", { ascending: true }),
    db.from("expenses").select("*").eq("submitted_by", volunteerId).order("created_at", { ascending: false }),
    db.from("tour_reports").select("*, tour:tours(id, title)").eq("submitted_by", volunteerId).order("created_at", { ascending: false }),
    tourId
      ? db.from("media_gallery").select("*").eq("tour_id", tourId).eq("uploaded_by", volunteerId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    db.from("volunteer_observations").select("*, author:users!volunteer_observations_author_id_fkey(id, name)").eq("volunteer_id", volunteerId).order("created_at", { ascending: false }),
  ]);

  return {
    registrationFee: registrationFee ?? null,
    workshopAttendance: workshopAttendance ?? [],
    formSubmissions: formSubmissions ?? [],
    eventRsvps: eventRsvps ?? [],
    demoEvaluations: demoEvaluations ?? [],
    dailyLogs: dailyLogs ?? [],
    schoolReports: schoolReports ?? [],
    travelTickets: travelTickets ?? [],
    expenses: expenses ?? [],
    tourReports: tourReports ?? [],
    media: media ?? [],
    observations: observations ?? [],
  };
}

// Core member notes about a volunteer — never surfaced to the volunteer, only to
// admins and core members. Admins can add/view across any volunteer; core members
// are scoped to volunteers in their own group via assertCoreMemberOverVolunteer.
export async function createVolunteerObservation(input: VolunteerObservationInput) {
  const { db, user } = await requireCoreMemberUser();
  const data = volunteerObservationSchema.parse(input);

  if (!ADMIN_ROLES.includes(user.role as string)) {
    if (!data.group_id) throw new Error("Unauthorized");
    await assertCoreMemberOverVolunteer(db, user, data.group_id, data.volunteer_id);
  }

  const { data: observation, error } = await db
    .from("volunteer_observations")
    .insert({ volunteer_id: data.volunteer_id, group_id: data.group_id ?? null, author_id: user.id, note: data.note })
    .select("*, author:users!volunteer_observations_author_id_fkey(id, name)")
    .single();
  if (error) { console.error("[createVolunteerObservation]", error); throw new Error("Failed to add observation"); }

  revalidatePath(`/core-member/volunteer/${data.volunteer_id}`);
  revalidatePath(`/admin/volunteers/${data.volunteer_id}`);
  return observation;
}

export async function getVolunteerObservations(volunteerId: string, groupId?: string) {
  const { db, user } = await requireCoreMemberUser();

  if (!ADMIN_ROLES.includes(user.role as string)) {
    if (!groupId) throw new Error("Unauthorized");
    await assertCoreMemberOverVolunteer(db, user, groupId, volunteerId);
  }

  const { data, error } = await db
    .from("volunteer_observations")
    .select("*, author:users!volunteer_observations_author_id_fkey(id, name)")
    .eq("volunteer_id", volunteerId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getVolunteerObservations]", error); throw new Error("Failed to fetch observations"); }
  return data ?? [];
}

export async function createDemoEvaluationForVolunteer(groupId: string, input: DemoEvaluationInput) {
  const { db, user } = await requireCoreMemberUser();
  const data = demoEvaluationSchema.parse(input);
  await assertCoreMemberOverVolunteer(db, user, groupId, data.volunteer_id);

  const { data: evaluation, error } = await db
    .from("demo_evaluations")
    .insert({ ...data, observer_id: user.id, total_score: totalOf(data.scores) })
    .select()
    .single();
  if (error) { console.error("[createDemoEvaluationForVolunteer]", error); throw new Error("Failed to create evaluation"); }

  revalidatePath(`/core-member/volunteer/${data.volunteer_id}`);
  return evaluation;
}

export async function updateDemoEvaluationForVolunteer(groupId: string, id: string, input: Partial<DemoEvaluationInput>) {
  const { db, user } = await requireCoreMemberUser();

  const { data: existing, error: fetchError } = await db.from("demo_evaluations").select("volunteer_id").eq("id", id).single();
  if (fetchError || !existing) throw new Error("Evaluation not found");
  await assertCoreMemberOverVolunteer(db, user, groupId, existing.volunteer_id);

  const data = demoEvaluationSchema.partial().parse(input);
  const patch: Record<string, unknown> = { ...data };
  if (data.scores) patch.total_score = totalOf(data.scores);

  const { data: evaluation, error } = await db
    .from("demo_evaluations")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[updateDemoEvaluationForVolunteer]", error); throw new Error("Failed to update evaluation"); }

  revalidatePath(`/core-member/volunteer/${existing.volunteer_id}`);
  return evaluation;
}
