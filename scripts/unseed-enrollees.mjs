// Deletes fake enrollees made by seed-enrollees.mjs (cascades to volunteer_profiles + tour_applications).
// Usage: node --env-file=.env.local scripts/unseed-enrollees.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
const { data, error } = await db
  .from("users")
  .delete()
  .like("clerk_id", "seed_enrollee_%")
  .select("id");
if (error) throw error;

console.log(`Deleted ${data.length} fake enrollees.`);
