// Deletes fake public content made by seed-public-content.mjs (gallery_images
// cascade with their gallery_categories).
// Usage: node --env-file=.env.local scripts/unseed-public-content.mjs
import { getServiceClient } from "./seed-utils.mjs";

const db = getServiceClient();
let total = 0;

const del = async (table, filterFn) => {
  const { data, error } = await filterFn(db.from(table).delete()).select("id");
  if (error) throw error;
  total += data.length;
  console.log(`  ${table}: ${data.length}`);
};

await del("testimonials", (q) =>
  q.eq("message", "This tour changed how I see education in India — the students and the team left a lasting impression on me.")
);
await del("alumni_registrations", (q) =>
  q.eq("highlights", "Led a team of volunteers on a rural outreach tour and helped set up a science exhibition.")
);
await del("blog_posts", (q) => q.like("cover_image_url", "https://placehold.co/1200x630.png%"));
await del("gallery_categories", (q) =>
  q.in("name", ["Tours", "Workshops", "Katta Events", "Certificates & Celebrations"])
);
await del("newsletters", (q) => q.like("title", "Gyan Setu Newsletter — Issue%"));
await del("sponsor_inquiries", (q) => q.eq("message", "Interested in supporting your upcoming tours as a CSR partner."));
await del("career_inquiries", (q) => q.eq("message", "Would love to join as a volunteer for the next tour cycle."));
await del("institution_inquiries", (q) =>
  q.eq("message", "Would like to host a Gyan Setu tour at our school next term.")
);

console.log(`Deleted ${total} seeded public-content rows.`);
