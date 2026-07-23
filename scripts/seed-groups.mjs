// Seeds fake tour_groups + tour_group_members for every existing tour.
// Usage: node --env-file=.env.local scripts/seed-groups.mjs [groupsPerTour]
import { getServiceClient, STATES, pick, pickMany, randInt } from "./seed-utils.mjs";

const groupsPerTourArg = Number(process.argv[2]) || null;
const db = getServiceClient();

const { data: tours, error: toursError } = await db.from("tours").select("id, title");
if (toursError) throw toursError;
if (!tours?.length) {
  console.log("No tours found — run seed-tours.mjs first.");
  process.exit(0);
}

const { data: admins } = await db.from("users").select("id").in("role", ["admin", "super_admin"]);
const { data: mentors } = await db.from("users").select("id").eq("role", "volunteer");
const { data: members } = await db.from("users").select("id").in("role", ["enrollee", "volunteer"]);

let totalGroups = 0;
let totalMembers = 0;

for (const tour of tours) {
  const groupCount = groupsPerTourArg || randInt(2, 4);
  const groups = Array.from({ length: groupCount }, (_, i) => ({
    tour_id: tour.id,
    name: `Group ${String.fromCharCode(65 + i)}`,
    state_allocated: pick(STATES),
    mentor_id: mentors?.length ? pick(mentors).id : null,
    created_by: admins?.length ? pick(admins).id : null,
  }));

  const { data: insertedGroups, error: groupsError } = await db
    .from("tour_groups")
    .insert(groups)
    .select("id");
  if (groupsError) throw groupsError;
  totalGroups += insertedGroups.length;

  if (members?.length) {
    const pool = pickMany(members, Math.min(members.length, insertedGroups.length * randInt(3, 6)));
    const groupMembers = pool.map((m, i) => ({
      group_id: insertedGroups[i % insertedGroups.length].id,
      user_id: m.id,
      role_in_group: i % insertedGroups.length === 0 ? "leader" : "member",
    }));
    const { error: membersError } = await db.from("tour_group_members").insert(groupMembers);
    if (membersError) throw membersError;
    totalMembers += groupMembers.length;
  }
}

console.log(`Seeded ${totalGroups} groups and ${totalMembers} group members across ${tours.length} tours.`);
