import { z } from "zod";

export const tourSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  destination: z.string().min(2),
  start_date: z.string(),
  end_date: z.string(),
  capacity: z.number().int().positive(),
  status: z.enum(["draft", "open", "closed", "completed"]).default("draft"),
  eligibility_test_id: z.string().uuid().optional(),
});

const testQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "multi_select", "subjective"]),
  question: z.string().min(5),
  options: z.array(z.string()).optional(),
  correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
  marks: z.number().int().positive(),
});

export const eligibilityTestSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  tour_id: z.string().uuid().optional().nullable(),
  duration_minutes: z.number().int().positive(),
  passing_score: z.number().int().min(0).max(100),
  questions: z.array(testQuestionSchema).min(1),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
  is_template: z.boolean().default(false),
});

const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "select",
    "checkbox",
    "radio",
    "date",
    "file",
    "image",
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  accept: z.string().optional(),
});

export const dynamicFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1),
  tour_id: z.string().uuid().optional().nullable(),
  target_role: z.enum(["enrollee", "volunteer", "admin", "all"]),
  status: z.enum(["draft", "active", "closed"]),
  is_template: z.boolean().default(false),
  category: z.enum(["general", "task", "survey", "cultural_activity"]).default("general"),
});

export const testAttemptSchema = z.object({
  test_id: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type TourInput = z.infer<typeof tourSchema>;
export type EligibilityTestInput = z.infer<typeof eligibilityTestSchema>;
export type DynamicFormInput = z.infer<typeof dynamicFormSchema>;
export type TestAttemptInput = z.infer<typeof testAttemptSchema>;

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  event_type: z.enum(["katta", "training", "workshop", "meeting", "demo", "presentation", "celebration", "other"]),
  tour_id: z.string().uuid().optional(),
  event_date: z.string(),
  event_time: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
});

export const tourGroupSchema = z.object({
  tour_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  state_allocated: z.string().optional(),
  mentor_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const certificateSchema = z.object({
  user_id: z.string().uuid(),
  tour_id: z.string().uuid().optional(),
  certificate_type: z.enum(["participation", "excellence", "leadership", "mentor"]),
  notes: z.string().optional(),
});

export const dailyLogSchema = z.object({
  tour_id: z.string().uuid(),
  log_date: z.string(),
  activities: z.string().min(5),
  observations: z.string().optional(),
  challenges: z.string().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
export type TourGroupInput = z.infer<typeof tourGroupSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type DailyLogInput = z.infer<typeof dailyLogSchema>;

export const visitSchema = z.object({
  title: z.string().min(3).max(200),
  destination: z.string().min(2).max(200),
  state: z.string().max(100).optional(),
  start_date: z.string(),
  end_date: z.string(),
  description: z.string().optional(),
  timetable_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "completed"]).default("upcoming"),
  capacity: z.number().int().positive().optional(),
});

export const newsletterSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  file_url: z.string().url().optional().or(z.literal("")),
  issue_number: z.number().int().positive().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const volunteerProfileSchema = z.object({
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  date_of_birth: z.string().optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  course_year: z.string().max(50).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  states_visited: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional(),
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  emergency_contact_relation: z.string().max(100).optional(),
  medical_notes: z.string().max(1000).optional(),
  consent_given: z.boolean().optional(),
  availability_notes: z.string().max(500).optional(),
  first_name: z.string().max(100).optional(),
  middle_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  gender: z.string().max(30).optional(),
  blood_group: z.string().max(10).optional(),
  aadhaar_number: z.string().max(20).optional(),
  photo_url: z.string().max(1000).optional(),
  alternate_phone: z.string().max(20).optional(),
  house_no: z.string().max(200).optional(),
  street: z.string().max(200).optional(),
  district: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  permanent_address_same: z.boolean().optional(),
  permanent_address: z.string().max(500).optional(),
  current_status: z.enum(["student", "working_professional", "both", "other"]).optional(),
  student_location: z.string().max(200).optional(),
  qualification: z.string().max(100).optional(),
  course_name: z.string().max(200).optional(),
  stream: z.string().max(100).optional(),
  edu_course_status: z.enum(["pursuing", "completed"]).optional(),
  company_name: z.string().max(200).optional(),
  work_location: z.string().max(200).optional(),
  designation: z.string().max(200).optional(),
  work_department: z.string().max(200).optional(),
  years_experience: z.number().int().min(0).max(70).optional(),
  emergency_contact_address: z.string().max(500).optional(),
  has_allergies: z.boolean().optional(),
  allergies_detail: z.string().max(1000).optional(),
  has_medical_conditions: z.boolean().optional(),
  medical_conditions_detail: z.string().max(1000).optional(),
  takes_medicines: z.boolean().optional(),
  medicines_detail: z.string().max(1000).optional(),
  dietary_restrictions: z.array(z.string()).optional(),
  certified_true: z.boolean().optional(),
  signature_name: z.string().max(200).optional(),
});


export const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  batch_year: z.string().max(20).optional(),
  role: z.string().max(100).optional(),
  message: z.string().min(10).max(100),
});

export const sponsorInquirySchema = z.object({
  organization_name: z.string().min(2).max(200),
  contact_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
});

export const careerInquirySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  age: z.number().int().min(1).max(120),
  standard: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  area_of_interest: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
});

const alumniVisitSchema = z.object({
  year: z.string().max(10).optional(),
  month: z.string().max(20).optional(),
  location: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
});

export const alumniRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  batch_year: z.string().max(10).optional(),
  tour_destination: z.string().max(200).optional(),
  role_during_tour: z.string().max(100).optional(),
  highlights: z.string().max(2000).optional(),
  willing_to_mentor: z.boolean().optional(),
  // Section 1: personal information
  first_name: z.string().max(100).optional(),
  middle_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  gender: z.string().max(30).optional(),
  date_of_birth: z.string().optional(),
  blood_group: z.string().max(10).optional(),
  // Section 2: visit history
  visit_history: z.array(alumniVisitSchema).optional(),
  // Section 3: professional & educational details
  company_name: z.string().max(200).optional(),
  work_location: z.string().max(200).optional(),
  designation: z.string().max(200).optional(),
  work_department: z.string().max(200).optional(),
  years_experience: z.number().int().min(0).max(70).optional(),
  institution: z.string().max(200).optional(),
  edu_location: z.string().max(200).optional(),
  qualification: z.string().max(100).optional(),
  course_name: z.string().max(200).optional(),
  stream: z.string().max(100).optional(),
  course_status: z.enum(["pursuing", "completed"]).optional(),
  year_semester: z.string().max(50).optional(),
  // Section 4: contact details
  mobile_number: z.string().max(20).optional(),
  alternate_mobile_number: z.string().max(20).optional(),
  linkedin_url: z.string().max(300).optional().or(z.literal("")),
  preferred_communication: z.array(z.string()).optional(),
  // Section 5: engagement with Gyan Setu
  interested_volunteering: z.enum(["Yes", "No", "Maybe"]).optional(),
  available_network_activities: z.enum(["Yes", "No", "Maybe"]).optional(),
  preferred_contribution: z.array(z.string()).optional(),
  areas_of_interest: z.array(z.string()).optional(),
  availability: z.enum(["Weekdays", "Weekends", "Both", "Occasionally"]).optional(),
  willing_to_mentor_new: z.enum(["Yes", "No", "Maybe"]).optional(),
  // Section 6: additional information
  why_stay_connected: z.string().max(2000).optional(),
  skills_contribute: z.string().max(2000).optional(),
  suggestions: z.string().max(2000).optional(),
  additional_remarks: z.string().max(2000).optional(),
});

export const institutionInquirySchema = z.object({
  institution_name: z.string().min(2).max(200),
  contact_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  institution_type: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  student_count: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
});

export type VisitInput = z.infer<typeof visitSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type VolunteerProfileInput = z.infer<typeof volunteerProfileSchema>;

// ── Volunteer journey modules ──────────────────────────────────────────────

export const registrationFeeSchema = z.object({
  volunteer_id: z.string().uuid(),
  amount: z.number().positive(),
  status: z.enum(["pending", "paid", "waived", "refunded"]).default("pending"),
  payment_reference: z.string().max(200).optional(),
  paid_at: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const workshopSchema = z.object({
  title: z.string().min(3).max(200),
  workshop_type: z.enum(["science", "mathematics", "exhibition_cultural", "other"]),
  workshop_date: z.string(),
  workshop_time: z.string().optional(),
  hall_location: z.string().max(200).optional(),
  trainer_id: z.string().uuid().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  kit_ready: z.boolean().default(false),
  plan_notes: z.string().max(2000).optional(),
});

export const workshopAttendeeSchema = z.object({
  workshop_id: z.string().uuid(),
  volunteer_id: z.string().uuid(),
  attendance_status: z.enum(["pending", "present", "absent", "excused"]).default("pending"),
  missed_summary: z.string().max(2000).optional(),
  makeup_decision: z.enum(["pending", "allowed", "not_allowed"]).optional(),
});

const demoEvaluationScoresSchema = z.object({
  content_delivery: z.number().min(0).max(10),
  hindi_communication: z.number().min(0).max(10),
  team_coordination: z.number().min(0).max(10),
  classroom_management: z.number().min(0).max(10),
  activity_flow: z.number().min(0).max(10),
  confidence: z.number().min(0).max(10),
  student_engagement: z.number().min(0).max(10),
});

export const demoEvaluationSchema = z.object({
  volunteer_id: z.string().uuid(),
  tour_id: z.string().uuid().optional(),
  scores: demoEvaluationScoresSchema,
  remarks: z.string().max(2000).optional(),
});

export const localHostSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  group_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const kitItemSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().max(100).optional(),
  quantity_per_school: z.number().int().positive().default(1),
  notes: z.string().max(500).optional(),
});

export const kitAssignmentSchema = z.object({
  group_id: z.string().uuid(),
  school_count: z.number().int().positive().default(1),
  packed: z.boolean().default(false),
  distributed: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const idCardSchema = z.object({
  volunteer_id: z.string().uuid(),
  card_number: z.string().min(2).max(100),
  valid_from: z.string(),
  valid_to: z.string(),
  card_file_url: z.string().url().optional().or(z.literal("")),
});

export const travelTicketSchema = z.object({
  group_id: z.string().uuid(),
  train_number: z.string().max(50).optional(),
  pnr: z.string().max(50).optional(),
  departure_station: z.string().max(200).optional(),
  arrival_station: z.string().max(200).optional(),
  departure_at: z.string().optional(),
  arrival_at: z.string().optional(),
  ticket_file_url: z.string().url().optional().or(z.literal("")),
  confirmation_status: z.enum(["pending", "confirmed", "cancelled"]).default("pending"),
  itinerary_approved: z.boolean().default(false),
});

export const locationUpdateSchema = z.object({
  group_id: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  note: z.string().max(1000).optional(),
  status_type: z.enum(["current_location", "train_delay", "arrival_estimate", "other"]).optional(),
});

export const expenseAdvanceSchema = z.object({
  group_id: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().max(1000).optional(),
});

export const expenseSchema = z.object({
  group_id: z.string().uuid(),
  category: z.enum(["travel", "accommodation", "food", "materials", "miscellaneous", "other"]),
  amount: z.number().positive(),
  bill_url: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
});

export const tourReportSchema = z.object({
  tour_id: z.string().uuid(),
  group_id: z.string().uuid().optional(),
  summary: z.string().min(10),
  highlights: z.string().max(3000).optional(),
  challenges: z.string().max(3000).optional(),
  report_file_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "submitted", "approved"]).default("draft"),
});

export type RegistrationFeeInput = z.infer<typeof registrationFeeSchema>;
export type WorkshopInput = z.infer<typeof workshopSchema>;
export type WorkshopAttendeeInput = z.infer<typeof workshopAttendeeSchema>;
export type DemoEvaluationInput = z.infer<typeof demoEvaluationSchema>;
export type LocalHostInput = z.infer<typeof localHostSchema>;
export type KitItemInput = z.infer<typeof kitItemSchema>;
export type KitAssignmentInput = z.infer<typeof kitAssignmentSchema>;
export type IdCardInput = z.infer<typeof idCardSchema>;
export type TravelTicketInput = z.infer<typeof travelTicketSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type ExpenseAdvanceInput = z.infer<typeof expenseAdvanceSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type TourReportInput = z.infer<typeof tourReportSchema>;
