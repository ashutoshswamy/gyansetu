// Seeds one fake user per staff role: admin, super_admin, earc_staff, group_core_member.
// Usage: node --env-file=.env.local scripts/seed-admins.mjs
import { randomUUID } from "node:crypto";
import { getServiceClient, FIRST_NAMES, LAST_NAMES, pick } from "./seed-utils.mjs";

const db = getServiceClient();

const roles = ["admin", "super_admin", "earc_staff", "group_core_member"];

const users = roles.map((role) => {
  const id = randomUUID();
  return {
    clerk_id: `seed_${role}_${id}`,
    email: `${role}.${id.slice(0, 8)}@example.com`,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    role,
  };
});

const { data: inserted, error } = await db.from("users").insert(users).select("id, role, name");
if (error) throw error;

console.log(`Seeded ${inserted.length} staff users: ${inserted.map((u) => u.role).join(", ")}.`);
