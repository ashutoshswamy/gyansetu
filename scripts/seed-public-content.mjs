// Seeds public-facing content: testimonials, alumni registrations, blog posts,
// gallery, newsletters, and the three public inquiry forms.
// Usage: node --env-file=.env.local scripts/seed-public-content.mjs
import { getServiceClient, FIRST_NAMES, LAST_NAMES, STATES, CITIES, pick, randInt } from "./seed-utils.mjs";

const db = getServiceClient();

const { data: admins } = await db.from("users").select("id").in("role", ["admin", "super_admin"]);
const createdBy = admins?.length ? pick(admins).id : null;

const fakeName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

// testimonials
const testimonials = Array.from({ length: 10 }, () => ({
  name: fakeName(),
  batch_year: String(randInt(2018, 2025)),
  role: pick(["Volunteer", "Alumni", "Group Leader", "Mentor"]),
  message: "This tour changed how I see education in India — the students and the team left a lasting impression on me.",
  status: "approved",
}));
const { error: testimonialsError } = await db.from("testimonials").insert(testimonials);
if (testimonialsError) throw testimonialsError;

// alumni registrations
const alumni = Array.from({ length: 12 }, () => {
  const first_name = pick(FIRST_NAMES);
  const last_name = pick(LAST_NAMES);
  return {
    name: `${first_name} ${last_name}`,
    first_name,
    last_name,
    email: `alumni.${randInt(1000, 9999)}@example.com`,
    batch_year: String(randInt(2015, 2024)),
    tour_destination: pick(STATES),
    role_during_tour: pick(["Volunteer", "Group Leader", "Mentor"]),
    highlights: "Led a team of volunteers on a rural outreach tour and helped set up a science exhibition.",
    willing_to_mentor: Math.random() > 0.5,
    gender: pick(["male", "female"]),
  };
});
const { error: alumniError } = await db.from("alumni_registrations").insert(alumni);
if (alumniError) throw alumniError;

// alumni_profiles for any already-seeded alumni-tagged users (skipped — no dedicated alumni role;
// alumni_registrations above is what the public alumni section reads).

// blog posts
const blogTopics = [
  "How Gyan Setu bridges rural classrooms and city volunteers",
  "5 lessons from our latest student exchange tour",
  "Behind the scenes: packing a science kit for 40 schools",
  "Why volunteer mentorship matters after the tour ends",
  "A day in the life of a Gyan Setu group leader",
  "Building trust with local schools: our host-partnership model",
];
const blogPosts = blogTopics.map((title, i) => ({
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  excerpt: "A look at how our volunteers and students make each tour count.",
  content: `${title}\n\nOur teams travel across the country to run hands-on learning sessions, science workshops, and cultural exchange days with students who rarely get access to this kind of programming. This post covers what worked, what we learned, and what's next.`,
  cover_image_url: `https://placehold.co/1200x630.png?text=Blog+${i + 1}`,
  status: "published",
  published_at: new Date(Date.now() - i * 7 * 86400000).toISOString(),
  created_by: createdBy,
}));
const { error: blogError } = await db.from("blog_posts").insert(blogPosts);
if (blogError) throw blogError;

// gallery
const categories = ["Tours", "Workshops", "Katta Events", "Certificates & Celebrations"];
const { data: insertedCategories, error: categoriesError } = await db
  .from("gallery_categories")
  .insert(categories.map((name) => ({ name, description: `Photos from ${name.toLowerCase()}.` })))
  .select("id, name");
if (categoriesError) throw categoriesError;

const galleryImages = insertedCategories.flatMap((cat) =>
  Array.from({ length: 6 }, (_, i) => ({
    category_id: cat.id,
    url: `https://placehold.co/800x600.png?text=${encodeURIComponent(cat.name)}+${i + 1}`,
    caption: `${cat.name} — moment ${i + 1}`,
    uploaded_by: createdBy,
  }))
);
const { error: imagesError } = await db.from("gallery_images").insert(galleryImages);
if (imagesError) throw imagesError;

// newsletters
const newsletters = Array.from({ length: 4 }, (_, i) => ({
  title: `Gyan Setu Newsletter — Issue ${i + 1}`,
  description: "Quarterly roundup of tours, milestones, and volunteer stories.",
  file_url: "https://placehold.co/600x800.pdf",
  issue_number: i + 1,
  status: "published",
  published_at: new Date(Date.now() - i * 30 * 86400000).toISOString(),
  created_by: createdBy,
}));
const { error: newslettersError } = await db.from("newsletters").insert(newsletters);
if (newslettersError) throw newslettersError;

// sponsor / career / institution inquiries
const { error: sponsorError } = await db.from("sponsor_inquiries").insert(
  Array.from({ length: 5 }, () => ({
    organization_name: `${pick(["Tata", "Infosys", "Wipro", "Reliance", "Adani"])} Foundation`,
    contact_name: fakeName(),
    email: `sponsor.${randInt(1000, 9999)}@example.com`,
    phone: `9${randInt(100000000, 999999999)}`,
    sponsorship_type: pick(["Financial", "In-kind", "Volunteering"]),
    message: "Interested in supporting your upcoming tours as a CSR partner.",
  }))
);
if (sponsorError) throw sponsorError;

const { error: careerError } = await db.from("career_inquiries").insert(
  Array.from({ length: 8 }, () => ({
    name: fakeName(),
    email: `career.${randInt(1000, 9999)}@example.com`,
    phone: `9${randInt(100000000, 999999999)}`,
    age: randInt(18, 24),
    standard: pick(["12th Standard", "Undergraduate", "Graduate"]),
    state: pick(STATES),
    city: pick(CITIES),
    area_of_interest: pick(["Teaching", "Event Management", "Content", "Logistics"]),
    message: "Would love to join as a volunteer for the next tour cycle.",
  }))
);
if (careerError) throw careerError;

const { error: institutionError } = await db.from("institution_inquiries").insert(
  Array.from({ length: 5 }, () => ({
    institution_name: `${pick(CITIES)} Public School`,
    contact_name: fakeName(),
    email: `institution.${randInt(1000, 9999)}@example.com`,
    phone: `9${randInt(100000000, 999999999)}`,
    institution_type: pick(["Government", "Private", "Ashram School"]),
    city: pick(CITIES),
    student_count: pick(["100-200", "200-500", "500+"]),
    message: "Would like to host a Gyan Setu tour at our school next term.",
  }))
);
if (institutionError) throw institutionError;

console.log(
  `Seeded ${testimonials.length} testimonials, ${alumni.length} alumni registrations, ${blogPosts.length} blog posts, ${galleryImages.length} gallery images across ${insertedCategories.length} categories, ${newsletters.length} newsletters, and sponsor/career/institution inquiries.`
);
