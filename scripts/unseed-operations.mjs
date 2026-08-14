// Deletes fake operational data made by seed-operations.mjs. Run before
// unseed-admins.mjs / unseed-volunteers.mjs / unseed-enrollees.mjs / unseed-tours.mjs /
// unseed-groups.mjs so the id lookups below still resolve.
// Usage: node --env-file=.env.local scripts/unseed-operations.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();

const idsOf = async (table, filterFn) => {
  const { data, error } = await filterFn(db.from(table).select("id"));
  if (error) throw error;
  return (data ?? []).map((r) => r.id);
};

const seededStaffIds = await idsOf("users", (q) =>
  q.like("clerk_id", "seed_%").in("role", ["admin", "super_admin", "earc_staff", "group_core_member"])
);
const seededVolunteerIds = await idsOf("users", (q) => q.like("clerk_id", "seed_volunteer_%"));
const seededEnrolleeIds = await idsOf("users", (q) => q.like("clerk_id", "seed_enrollee_%"));
const seededTourIds = await idsOf("tours", (q) => q.like("title", "% Student Exchange Tour"));
const seededGroupIds = seededTourIds.length
  ? await idsOf("tour_groups", (q) => q.in("tour_id", seededTourIds))
  : [];

let total = 0;
const del = async (table, filterFn) => {
  const { data, error } = await filterFn(db.from(table).delete()).select("id");
  if (error) throw error;
  total += data.length;
  console.log(`  ${table}: ${data.length}`);
};

if (seededTourIds.length) await del("events", (q) => q.in("tour_id", seededTourIds));
if (seededVolunteerIds.length) {
  await del("daily_logs", (q) => q.in("volunteer_id", seededVolunteerIds));
  await del("certificates", (q) => q.in("user_id", seededVolunteerIds));
  await del("registration_fees", (q) => q.in("volunteer_id", seededVolunteerIds));
  await del("demo_evaluations", (q) => q.in("volunteer_id", seededVolunteerIds));
  await del("id_cards", (q) => q.in("volunteer_id", seededVolunteerIds));
  await del("volunteer_observations", (q) => q.in("volunteer_id", seededVolunteerIds));
}
const notifyIds = [...seededVolunteerIds, ...seededEnrolleeIds];
if (notifyIds.length) await del("notifications", (q) => q.in("user_id", notifyIds));
if (seededTourIds.length) {
  await del("eligibility_tests", (q) => q.in("tour_id", seededTourIds));
  await del("tour_reports", (q) => q.in("tour_id", seededTourIds));
}
if (seededStaffIds.length) {
  await del("dynamic_forms", (q) =>
    q.in("title", ["Pre-Tour Task Assignment", "Post-Tour Survey"]).in("created_by", seededStaffIds)
  );
  await del("workshops", (q) => q.in("created_by", seededStaffIds));
  await del("local_hosts", (q) => q.in("created_by", seededStaffIds));
  await del("earc_school_profiles", (q) => q.in("created_by", seededStaffIds));
  await del("earc_students", (q) => q.in("created_by", seededStaffIds));
}
await del("kit_items", (q) => q.in("name", ["Science kit box", "Worksheets", "Chart paper", "First aid kit"]));
if (seededGroupIds.length) {
  await del("kit_assignments", (q) => q.in("group_id", seededGroupIds));
  await del("travel_tickets", (q) => q.in("group_id", seededGroupIds));
  await del("expense_advances", (q) => q.in("group_id", seededGroupIds));
  await del("expenses", (q) => q.in("group_id", seededGroupIds));
  await del("school_reports", (q) => q.in("group_id", seededGroupIds));
}

console.log(`Deleted ${total} seeded operational rows.`);
