// Deletes EVERY user in the Clerk instance CLERK_SECRET_KEY points to.
// Irreversible. Dry-runs by default — pass --yes to actually delete.
// Clerk's user.deleted webhook (app/api/webhooks/clerk/route.ts) removes the
// matching row from public.users automatically, but only if that webhook is
// live/reachable for this instance — check the Supabase `users` table after
// running if it isn't.
//
// Usage:
//   node --env-file=.env.local scripts/delete-all-clerk-users.mjs         # dry run
//   node --env-file=.env.local scripts/delete-all-clerk-users.mjs --yes   # actually delete
import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  throw new Error("Missing CLERK_SECRET_KEY. Run with: node --env-file=.env.local scripts/delete-all-clerk-users.mjs");
}

const clerk = createClerkClient({ secretKey });
const confirmed = process.argv.includes("--yes");

async function getAllUsers() {
  const limit = 500;
  let offset = 0;
  const all = [];
  for (;;) {
    const { data } = await clerk.users.getUserList({ limit, offset });
    all.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

const users = await getAllUsers();
console.log(`Found ${users.length} Clerk user(s).`);

if (!confirmed) {
  console.log("Dry run — no users deleted. Re-run with --yes to delete all of them.");
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (const user of users) {
  try {
    await clerk.users.deleteUser(user.id);
    deleted++;
    console.log(`Deleted ${user.id} (${user.primaryEmailAddress?.emailAddress ?? "no email"})`);
  } catch (err) {
    failed++;
    console.error(`Failed to delete ${user.id}:`, err instanceof Error ? err.message : err);
  }
}

console.log(`Done. Deleted ${deleted}, failed ${failed}.`);
