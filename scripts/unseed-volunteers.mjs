// Deletes fake volunteers made by seed-volunteers.mjs (cascades to volunteer_profiles).
// Usage: node --env-file=.env.local scripts/unseed-volunteers.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
const { data, error } = await db
  .from("users")
  .delete()
  .like("clerk_id", "seed_volunteer_%")
  .select("id");
if (error) throw error;

console.log(`Deleted ${data.length} fake volunteers.`);
