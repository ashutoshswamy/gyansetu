// Seeds fake tours.
// Usage: node --env-file=.env.local scripts/seed-tours.mjs [count]
import { getServiceClient, STATES, pick, randInt } from "./seed-utils.mjs";

const count = Number(process.argv[2]) || 5;
const db = getServiceClient();

const { data: admins } = await db.from("users").select("id").in("role", ["admin", "super_admin"]);
const createdBy = admins?.length ? pick(admins).id : null;

function fakeDateRange() {
  const start = new Date();
  start.setDate(start.getDate() + randInt(14, 200));
  const end = new Date(start);
  end.setDate(end.getDate() + randInt(5, 14));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

const tours = Array.from({ length: count }, () => {
  const destination = pick(STATES);
  const [start_date, end_date] = fakeDateRange();
  return {
    title: `${destination} Student Exchange Tour`,
    description: `An educational exchange tour to ${destination}, exposing students to local culture, history, and community service opportunities.`,
    destination,
    start_date,
    end_date,
    capacity: randInt(20, 100),
    status: pick(["draft", "open", "closed", "completed"]),
    created_by: createdBy,
  };
});

const { data: inserted, error } = await db.from("tours").insert(tours).select("id, title, status");
if (error) throw error;

console.log(`Seeded ${inserted.length} fake tours.`);
