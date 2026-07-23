// Seeds fake enrollee (student) users + volunteer_profiles, and applies each
// to a random open tour if any tours exist.
// Usage: node --env-file=.env.local scripts/seed-enrollees.mjs [count]
import { randomUUID } from "node:crypto";
import { getServiceClient, FIRST_NAMES, LAST_NAMES, pick, randInt, fakeProfileRow } from "./seed-utils.mjs";

const count = Number(process.argv[2]) || 20;
const db = getServiceClient();

const users = Array.from({ length: count }, () => {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const id = randomUUID();
  return {
    clerk_id: `seed_enrollee_${id}`,
    email: `enrollee.${id.slice(0, 8)}@example.com`,
    name,
    role: "enrollee",
  };
});

const { data: insertedUsers, error: usersError } = await db.from("users").insert(users).select("id");
if (usersError) throw usersError;

const profiles = insertedUsers.map((u) => fakeProfileRow(u.id));
const { error: profilesError } = await db.from("volunteer_profiles").insert(profiles);
if (profilesError) throw profilesError;

const { data: tours, error: toursError } = await db.from("tours").select("id").eq("status", "open");
if (toursError) throw toursError;

if (tours?.length) {
  const statuses = ["pending", "shortlisted", "selected", "rejected"];
  const applications = insertedUsers.map((u) => {
    const status = pick(statuses);
    return {
      tour_id: pick(tours).id,
      student_id: u.id,
      status,
      test_score: status === "pending" ? null : randInt(40, 100),
    };
  });
  const { error: applicationsError } = await db.from("tour_applications").insert(applications);
  if (applicationsError) throw applicationsError;
  console.log(`Applied ${applications.length} enrollees to open tours.`);
} else {
  console.log("No open tours found — skipped tour_applications.");
}

console.log(`Seeded ${insertedUsers.length} fake enrollees.`);
