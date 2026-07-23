// Shared fake-data helpers for seed-*.mjs scripts. Run with:
//   node --env-file=.env.local scripts/seed-volunteers.mjs [count]
import { createClient } from "@supabase/supabase-js";

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/<script>.mjs"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Krishna", "Ishaan",
  "Ananya", "Diya", "Saanvi", "Aadhya", "Kiara", "Myra", "Anika", "Riya",
  "Rohan", "Kabir", "Aryan", "Pranav", "Neha", "Priya", "Meera", "Isha",
];
export const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Iyer", "Rao",
  "Singh", "Kumar", "Joshi", "Mehta", "Kulkarni", "Desai", "Chatterjee", "Das",
];
export const STATES = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Rajasthan",
  "Uttar Pradesh", "West Bengal", "Punjab", "Kerala", "Telangana", "Bihar",
];
export const CITIES = [
  "Mumbai", "Pune", "Bengaluru", "Chennai", "New Delhi", "Ahmedabad",
  "Jaipur", "Lucknow", "Kolkata", "Chandigarh", "Kochi", "Hyderabad", "Patna",
];
export const INSTITUTIONS = [
  "IIT Bombay", "Delhi University", "VJTI", "Anna University", "BITS Pilani",
  "St. Xavier's College", "Fergusson College", "NIT Trichy", "Jadavpur University",
];
export const SKILLS = [
  "Public Speaking", "First Aid", "Photography", "Event Management",
  "Translation", "Cooking", "Music", "Sports Coaching", "Teaching", "Videography",
];
export const LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Bengali", "Gujarati", "Telugu"];
export const RELATIONS = ["Father", "Mother", "Spouse", "Sibling", "Guardian"];
export const GENDERS = ["male", "female", "other"];

export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[randInt(0, arr.length - 1)];
export const pickMany = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
export const fakePhone = () => `9${randInt(100000000, 999999999)}`;
export const fakePincode = () => String(randInt(100000, 999999));

export function fakeDateOfBirth() {
  const year = randInt(1998, 2008);
  const month = String(randInt(1, 12)).padStart(2, "0");
  const day = String(randInt(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Shared columns for public.volunteer_profiles — used by both volunteers and enrollees.
export function fakeProfileRow(userId) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    phone: fakePhone(),
    alternate_phone: fakePhone(),
    gender: pick(GENDERS),
    date_of_birth: fakeDateOfBirth(),
    blood_group: pick(["A+", "B+", "O+", "AB+", "A-", "B-", "O-"]),
    state: pick(STATES),
    city: pick(CITIES),
    house_no: String(randInt(1, 999)),
    street: `${randInt(1, 20)}th Cross Road`,
    district: pick(CITIES),
    pincode: fakePincode(),
    permanent_address_same: true,
    institution: pick(INSTITUTIONS),
    course_year: `${randInt(1, 4)} Year`,
    current_status: "student",
    qualification: pick(["12th Standard", "Bachelor's", "Diploma"]),
    course_name: pick(["Computer Science", "Commerce", "Mechanical Engineering", "Arts"]),
    skills: pickMany(SKILLS, randInt(2, 4)),
    languages: pickMany(LANGUAGES, randInt(1, 3)),
    previous_visits: randInt(0, 5),
    states_visited: pickMany(STATES, randInt(0, 3)),
    bio: `${firstName} is a ${randInt(18, 26)} year old volunteer passionate about community service.`,
    photo_url: "https://placehold.co/400x400.png",
    emergency_contact_name: `${pick(FIRST_NAMES)} ${lastName}`,
    emergency_contact_phone: fakePhone(),
    emergency_contact_relation: pick(RELATIONS),
    has_allergies: false,
    has_medical_conditions: false,
    takes_medicines: false,
    dietary_restrictions: pickMany(["Vegetarian", "Vegan", "Gluten-free", "None"], 1),
    availability_notes: "Available on weekends and during semester breaks.",
    consent_given: true,
    consent_given_at: new Date().toISOString(),
    certified_true: true,
    signature_name: `${firstName} ${lastName}`,
  };
}
