// Deletes fake groups made by seed-groups.mjs (cascades to tour_group_members).
// Leaves tours untouched — run unseed-tours.mjs separately for those.
// Usage: node --env-file=.env.local scripts/unseed-groups.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
const { data, error } = await db
  .from("tour_groups")
  .delete()
  .like("name", "Group _")
  .select("id");
if (error) throw error;

console.log(`Deleted ${data.length} fake groups.`);
