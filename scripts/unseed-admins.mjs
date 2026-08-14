// Deletes fake staff users made by seed-admins.mjs.
// Usage: node --env-file=.env.local scripts/unseed-admins.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
const { data, error } = await db
  .from("users")
  .delete()
  .like("clerk_id", "seed_%")
  .in("role", ["admin", "super_admin", "earc_staff", "group_core_member"])
  .select("id");
if (error) throw error;

console.log(`Deleted ${data.length} fake staff users.`);
