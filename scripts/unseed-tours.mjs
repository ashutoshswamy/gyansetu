// Deletes fake tours made by seed-tours.mjs (cascades to tour_groups + tour_group_members).
// Usage: node --env-file=.env.local scripts/unseed-tours.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
const { data, error } = await db
  .from("tours")
  .delete()
  .like("title", "% Student Exchange Tour")
  .select("id");
if (error) throw error;

console.log(`Deleted ${data.length} fake tours.`);
