// Seeds operational data across admin / volunteer / earc / core-member panels:
// events, daily logs, certificates, notifications, tests, forms, registration
// fees, workshops, demo evaluations, local hosts, kits, id cards, travel,
// expenses, tour/school reports, and EARC data-collection records.
//
// Run after seed-admins.mjs, seed-tours.mjs, seed-groups.mjs, seed-volunteers.mjs,
// and seed-enrollees.mjs so it has users/tours/groups to attach to.
// Usage: node --env-file=.env.local scripts/seed-operations.mjs
import { getServiceClient, STATES, CITIES, pick, pickMany, randInt } from "./seed-utils.mjs";

const db = getServiceClient();

const { data: admins } = await db.from("users").select("id").in("role", ["admin", "super_admin"]);
const { data: earcStaff } = await db.from("users").select("id").eq("role", "earc_staff");
const { data: volunteers } = await db.from("users").select("id").eq("role", "volunteer");
const { data: enrollees } = await db.from("users").select("id").eq("role", "enrollee");
const { data: tours } = await db.from("tours").select("id, title");
const { data: groups } = await db.from("tour_groups").select("id, tour_id");

const admin = () => (admins?.length ? pick(admins).id : null);
const earc = () => (earcStaff?.length ? pick(earcStaff).id : admin());
const volunteer = () => (volunteers?.length ? pick(volunteers).id : null);

if (!tours?.length || !volunteers?.length) {
  console.log("Run seed-admins.mjs, seed-tours.mjs, seed-groups.mjs, and seed-volunteers.mjs first.");
  process.exit(0);
}

// events + event_attendees
const eventTypes = ["katta", "melawa", "training", "workshop", "meeting", "demo", "presentation", "celebration"];
const events = eventTypes.map((event_type, i) => ({
  title: `${event_type[0].toUpperCase()}${event_type.slice(1)} — ${pick(tours).title}`,
  description: `A ${event_type.replace("_", " ")} session for volunteers and students.`,
  event_type,
  tour_id: pick(tours).id,
  event_date: new Date(Date.now() + (i - 2) * 5 * 86400000).toISOString().slice(0, 10),
  event_time: "10:00 AM",
  location: pick(CITIES),
  status: pick(["upcoming", "ongoing", "completed"]),
  created_by: admin(),
}));
const { data: insertedEvents, error: eventsError } = await db.from("events").insert(events).select("id");
if (eventsError) throw eventsError;

const attendees = [...volunteers, ...(enrollees ?? [])].flatMap((u) =>
  pickMany(insertedEvents, randInt(1, 3)).map((e) => ({
    event_id: e.id,
    user_id: u.id,
    rsvp_status: pick(["pending", "confirmed", "attended"]),
  }))
);
// unique(event_id, user_id) — dedupe
const seenPairs = new Set();
const dedupedAttendees = attendees.filter((a) => {
  const key = `${a.event_id}:${a.user_id}`;
  if (seenPairs.has(key)) return false;
  seenPairs.add(key);
  return true;
});
const { error: attendeesError } = await db.from("event_attendees").insert(dedupedAttendees);
if (attendeesError) throw attendeesError;

// daily_logs
const dailyLogs = volunteers.slice(0, 15).map((v, i) => ({
  tour_id: pick(tours).id,
  volunteer_id: v.id,
  log_date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  activities_conducted: "Ran a science demo session and a group discussion with students.",
  key_achievements: "Students engaged actively; two students expressed interest in higher studies.",
  challenges_faced: "Limited electricity access delayed the demo by 30 minutes.",
  biggest_learning: "Flexibility in session planning is essential in rural settings.",
  participant_impact: "Visible increase in curiosity and question-asking among students.",
}));
const { error: logsError } = await db.from("daily_logs").insert(dailyLogs);
if (logsError) throw logsError;

// certificates
const certificates = volunteers.slice(0, 12).map((v) => ({
  user_id: v.id,
  tour_id: pick(tours).id,
  certificate_type: pick(["participation", "excellence", "leadership", "mentor"]),
  issued_by: admin(),
  state: pick(STATES),
  place: pick(CITIES),
  duration_of_visit: `${randInt(5, 14)} days`,
  volunteer_code: `GS-${randInt(1000, 9999)}`,
}));
const { error: certsError } = await db.from("certificates").insert(certificates);
if (certsError) throw certsError;

// notifications
const notifications = [...volunteers, ...(enrollees ?? [])].slice(0, 25).map((u) => ({
  user_id: u.id,
  title: pick(["Tour update", "New assignment", "Document approved", "Reminder"]),
  message: "Your latest submission has been reviewed. Check your dashboard for details.",
  type: pick(["info", "success", "warning"]),
  read: Math.random() > 0.5,
}));
const { error: notificationsError } = await db.from("notifications").insert(notifications);
if (notificationsError) throw notificationsError;

// eligibility_tests + dynamic_forms
const { data: insertedTests, error: testsError } = await db
  .from("eligibility_tests")
  .insert(
    tours.map((t) => ({
      title: `${t.title} — Eligibility Test`,
      description: "Screening test for tour applicants.",
      tour_id: t.id,
      duration_minutes: 30,
      passing_score: 60,
      questions: [
        { question: "Why do you want to join this tour?", type: "text" },
        { question: "Rate your comfort with public speaking (1-5)", type: "number" },
      ],
      status: "active",
      created_by: admin(),
    }))
  )
  .select("id");
if (testsError) throw testsError;

const { error: formsError } = await db.from("dynamic_forms").insert([
  {
    title: "Pre-Tour Task Assignment",
    description: "Submit your assigned pre-tour task.",
    fields: [{ label: "Task summary", type: "textarea" }],
    target_role: "volunteer",
    status: "active",
    category: "task",
    created_by: admin(),
  },
  {
    title: "Post-Tour Survey",
    description: "Share feedback on your tour experience.",
    fields: [{ label: "Overall experience", type: "textarea" }],
    target_role: "all",
    status: "active",
    category: "survey",
    created_by: admin(),
  },
]);
if (formsError) throw formsError;

// registration_fees
const { error: feesError } = await db.from("registration_fees").insert(
  volunteers.slice(0, 15).map((v) => ({
    volunteer_id: v.id,
    amount: 1500,
    status: pick(["pending", "submitted", "paid"]),
    tour_id: pick(tours).id,
  }))
);
if (feesError) throw feesError;

// workshops + workshop_groups + workshop_attendees
const workshopTypes = ["science", "mathematics", "exhibition_country", "cultural_survey", "other"];
const { data: insertedWorkshops, error: workshopsError } = await db
  .from("workshops")
  .insert(
    workshopTypes.map((workshop_type, i) => ({
      title: `${workshop_type.replace("_", " ")} workshop`,
      workshop_type,
      workshop_date: new Date(Date.now() + i * 3 * 86400000).toISOString().slice(0, 10),
      workshop_time: "2:00 PM",
      hall_location: `Hall ${i + 1}`,
      trainer_id: volunteer(),
      status: pick(["scheduled", "completed"]),
      kit_ready: true,
      created_by: admin(),
    }))
  )
  .select("id");
if (workshopsError) throw workshopsError;

if (groups?.length) {
  const { error: wgError } = await db.from("workshop_groups").insert(
    insertedWorkshops.map((w) => ({ workshop_id: w.id, group_id: pick(groups).id }))
  );
  if (wgError) throw wgError;
}

const { error: waError } = await db.from("workshop_attendees").insert(
  volunteers.slice(0, 10).flatMap((v) =>
    pickMany(insertedWorkshops, 1).map((w) => ({
      workshop_id: w.id,
      volunteer_id: v.id,
      attendance_status: pick(["present", "absent", "pending"]),
    }))
  )
);
if (waError) throw waError;

// demo_evaluations
const { error: demoError } = await db.from("demo_evaluations").insert(
  volunteers.slice(0, 10).map((v) => ({
    volunteer_id: v.id,
    observer_id: admin(),
    tour_id: pick(tours).id,
    scores: { content: 8, delivery: 7, engagement: 9 },
    total_score: 24,
    remarks: "Confident delivery, good rapport with students.",
    status: "submitted",
  }))
);
if (demoError) throw demoError;

// local_hosts
const { error: hostsError } = await db.from("local_hosts").insert(
  Array.from({ length: 8 }, () => ({
    name: `${pick(CITIES)} Community Host`,
    phone: `9${randInt(100000000, 999999999)}`,
    email: `host.${randInt(1000, 9999)}@example.com`,
    state: pick(STATES),
    district: pick(CITIES),
    address: `${randInt(1, 99)} Main Road`,
    group_id: groups?.length ? pick(groups).id : null,
    created_by: admin(),
  }))
);
if (hostsError) throw hostsError;

// kit_items + kit_assignments
const { data: insertedKitItems, error: kitItemsError } = await db
  .from("kit_items")
  .insert([
    { name: "Science kit box", category: "science", quantity_per_school: 1, material_type: "reusable" },
    { name: "Worksheets", category: "stationery", quantity_per_school: 40, material_type: "consumable" },
    { name: "Chart paper", category: "stationery", quantity_per_school: 10, material_type: "consumable" },
    { name: "First aid kit", category: "safety", quantity_per_school: 1, material_type: "reusable" },
  ])
  .select("id");
if (kitItemsError) throw kitItemsError;

if (groups?.length) {
  const { error: kaError } = await db.from("kit_assignments").insert(
    groups.map((g) => ({
      group_id: g.id,
      school_count: randInt(2, 6),
      packed: Math.random() > 0.5,
      distributed: Math.random() > 0.7,
      created_by: admin(),
    }))
  );
  if (kaError) throw kaError;
}

// id_cards
const { error: idCardsError } = await db.from("id_cards").insert(
  volunteers.slice(0, 15).map((v, i) => ({
    volunteer_id: v.id,
    card_number: `GS-ID-${1000 + i}`,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_to: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    tour_id: pick(tours).id,
    group_id: groups?.length ? pick(groups).id : null,
    state: pick(STATES),
    place: pick(CITIES),
    issued_by: admin(),
  }))
);
if (idCardsError) throw idCardsError;

// travel_tickets + expenses (group-scoped)
if (groups?.length) {
  const { error: ticketsError } = await db.from("travel_tickets").insert(
    groups.map((g) => ({
      group_id: g.id,
      train_number: String(randInt(10000, 19999)),
      train_name: `${pick(CITIES)} Express`,
      pnr: String(randInt(1000000000, 9999999999)),
      departure_station: pick(CITIES),
      arrival_station: pick(CITIES),
      departure_at: new Date(Date.now() + randInt(5, 30) * 86400000).toISOString(),
      arrival_at: new Date(Date.now() + randInt(31, 33) * 86400000).toISOString(),
      confirmation_status: pick(["pending", "confirmed"]),
      itinerary_approved: Math.random() > 0.5,
      created_by: admin(),
    }))
  );
  if (ticketsError) throw ticketsError;

  const { error: advancesError } = await db.from("expense_advances").insert(
    groups.map((g) => ({ group_id: g.id, amount: randInt(5000, 20000), given_by: admin() }))
  );
  if (advancesError) throw advancesError;

  const { error: expensesError } = await db.from("expenses").insert(
    groups.flatMap((g) =>
      Array.from({ length: 3 }, () => ({
        group_id: g.id,
        submitted_by: volunteer(),
        category: pick(["travel", "accommodation", "food", "materials", "miscellaneous"]),
        vendor_name: `${pick(CITIES)} Vendor`,
        amount: randInt(200, 5000),
        description: "Expense incurred during the tour.",
        status: pick(["pending", "approved"]),
        approved_by: admin(),
      }))
    )
  );
  if (expensesError) throw expensesError;
}

// tour_reports + school_reports
const { error: tourReportsError } = await db.from("tour_reports").insert(
  tours.map((t) => ({
    tour_id: t.id,
    group_id: groups?.length ? pick(groups).id : null,
    submitted_by: volunteer(),
    location_name: pick(CITIES),
    hosts: [{ name: `${pick(CITIES)} Host`, role: "Coordinator" }],
    logistics_scores: { travel: 8, accommodation: 7, food: 9 },
    unique_features: "Strong community involvement and enthusiastic student turnout.",
    best_practices: "Local host coordinated transport a day in advance.",
    overall_recommendation: "Highly Recommended",
    suitable_residential_camps: true,
    follow_up_required: false,
    status: "submitted",
  }))
);
if (tourReportsError) throw tourReportsError;

if (groups?.length) {
  const { error: schoolReportsError } = await db.from("school_reports").insert(
    groups.map((g) => ({
      group_id: g.id,
      submitted_by: volunteer(),
      school_name: `${pick(CITIES)} Zilla Parishad School`,
      school_type: "Government",
      location_category: pick(["Rural", "Semi-Urban"]),
      medium_of_instruction: pick(["Marathi", "Hindi", "English"]),
      district: pick(CITIES),
      state: pick(STATES),
      visit_date: new Date().toISOString().slice(0, 10),
      volunteers_present_count: randInt(3, 8),
      volunteer_names: ["Volunteer A", "Volunteer B"],
      sessions: [{ topic: "Science demo", duration_minutes: 60 }],
      student_response: "Students were highly engaged and asked thoughtful questions throughout the session.",
      what_went_well: "Hands-on activities kept students interested for the full session.",
      overall_rating: "Excellent",
      follow_up_required: false,
      status: "submitted",
    }))
  );
  if (schoolReportsError) throw schoolReportsError;
}

// EARC: school profiles + students
const { error: earcSchoolError } = await db.from("earc_school_profiles").insert(
  Array.from({ length: 6 }, () => ({
    academic_year: "2025-26",
    project: pick(["Chhote Scientists", "Vikas Mitra", "Pradnya Vikas", "Anubha Shala"]),
    school_name: `${pick(CITIES)} Municipal School`,
    state: pick(STATES),
    district: pick(CITIES),
    taluka_block: pick(CITIES),
    village_city: pick(CITIES),
    school_type: pick(["Government", "Private", "Ashram School"]),
    module: pick(["Facilitator", "Teacher Training"]),
    mode: pick(["Online", "Offline"]),
    contact_number: `9${randInt(100000000, 999999999)}`,
    num_teachers_involved: randInt(2, 10),
    location_type: pick(["Urban", "Rural", "Tribal", "Semi-Urban"]),
    medium_of_instruction: pick(["English", "Marathi", "Hindi"]),
    duration_per_session: pick(["1 hr", "1.5 hrs", "2 hrs"]),
    num_sessions_conducted: randInt(5, 20),
    total_students: randInt(50, 300),
    created_by: earc(),
  }))
);
if (earcSchoolError) throw earcSchoolError;

const { error: earcStudentsError } = await db.from("earc_students").insert(
  Array.from({ length: 20 }, () => ({
    first_name: pick(["Aarav", "Ananya", "Vivaan", "Diya"]),
    last_name: pick(["Sharma", "Verma", "Patel"]),
    mobile_number: `9${randInt(100000000, 999999999)}`,
    gender: pick(["Male", "Female"]),
    blood_group: pick(["A+", "B+", "O+", "AB+"]),
    standard: pick(["5th", "6th", "7th", "8th", "9th", "10th"]),
    created_by: earc(),
  }))
);
if (earcStudentsError) throw earcStudentsError;

// volunteer_observations (core-member private notes)
const { error: obsError } = await db.from("volunteer_observations").insert(
  volunteers.slice(0, 8).map((v) => ({
    volunteer_id: v.id,
    group_id: groups?.length ? pick(groups).id : null,
    author_id: admin(),
    note: "Consistently proactive during sessions; strong candidate for a future group-lead role.",
  }))
);
if (obsError) throw obsError;

console.log("Seeded operational data: events, daily logs, certificates, notifications, tests, forms, fees, workshops, demo evaluations, local hosts, kits, id cards, travel, expenses, tour/school reports, and EARC records.");
