// Seeds fake volunteer users + volunteer_profiles.
// Usage: node --env-file=.env.local scripts/seed-volunteers.mjs [count]
import { randomUUID } from "node:crypto";
import { getServiceClient, FIRST_NAMES, LAST_NAMES, pick, fakeProfileRow } from "./seed-utils.mjs";

const count = Number(process.argv[2]) || 20;
const db = getServiceClient();

const users = Array.from({ length: count }, () => {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const id = randomUUID();
  return {
    clerk_id: `seed_volunteer_${id}`,
    email: `volunteer.${id.slice(0, 8)}@example.com`,
    name,
    role: "volunteer",
  };
});

const { data: insertedUsers, error: usersError } = await db.from("users").insert(users).select("id");
if (usersError) throw usersError;

const profiles = insertedUsers.map((u) => fakeProfileRow(u.id));
const { error: profilesError } = await db.from("volunteer_profiles").insert(profiles);
if (profilesError) throw profilesError;

console.log(`Seeded ${insertedUsers.length} fake volunteers.`);
