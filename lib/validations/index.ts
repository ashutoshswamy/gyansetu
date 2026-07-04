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
  tour_id: z.string().uuid(),
  duration_minutes: z.number().int().positive(),
  passing_score: z.number().int().min(0).max(100),
  questions: z.array(testQuestionSchema).min(1),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
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
});


export const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  batch_year: z.string().max(20).optional(),
  role: z.string().max(100).optional(),
  message: z.string().min(10).max(2000),
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

export const alumniRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  batch_year: z.string().max(10).optional(),
  tour_destination: z.string().max(200).optional(),
  role_during_tour: z.string().max(100).optional(),
  highlights: z.string().max(2000).optional(),
  willing_to_mentor: z.boolean().optional(),
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
