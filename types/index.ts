export type UserRole = "volunteer" | "admin" | "earc_staff";

export interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  role: UserRole | null;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  destination: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: "draft" | "open" | "closed" | "completed";
  eligibility_test_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TourApplication {
  id: string;
  tour_id: string;
  student_id: string;
  status: "pending" | "shortlisted" | "selected" | "rejected";
  test_score?: number;
  submitted_at: string;
  updated_at: string;
  tour?: Tour;
  student?: UserProfile;
}

export type QuestionType = "mcq" | "multi_select" | "subjective";

export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer?: string | string[];
  marks: number;
}

export interface EligibilityTest {
  id: string;
  title: string;
  description?: string;
  tour_id?: string;
  duration_minutes: number;
  passing_score: number;
  questions: TestQuestion[];
  status: "draft" | "active" | "closed";
  is_template: boolean;
  created_by: string;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, string | string[]>;
  score?: number;
  status: "in_progress" | "submitted" | "evaluated" | "pending_approval" | "approved" | "rejected";
  started_at: string;
  submitted_at?: string;
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "image";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  accept?: string;
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  tour_id?: string;
  target_role: UserRole | "enrollee" | "all";
  status: "draft" | "active" | "closed";
  is_template: boolean;
  category: "general" | "task" | "survey" | "cultural_activity";
  created_by: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  submitted_by: string;
  data: Record<string, unknown>;
  submitted_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_tours: number;
  active_tours: number;
  total_enrollees: number;
  total_volunteers: number;
  pending_applications: number;
  completed_tests: number;
}

// SOP Phase Extensions

export type EventType = "katta" | "training" | "workshop" | "meeting" | "demo" | "presentation" | "celebration" | "other";

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  tour_id?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_by: string;
  created_at: string;
  updated_at: string;
  tour?: Tour;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_status: "pending" | "confirmed" | "attended" | "absent";
  created_at: string;
  user?: UserProfile;
}

export interface TourGroup {
  id: string;
  tour_id: string;
  name: string;
  state_allocated?: string;
  mentor_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tour?: Tour;
  mentor?: UserProfile;
  members?: TourGroupMember[];
}

export interface TourGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role_in_group?: string;
  created_at: string;
  user?: UserProfile;
}

export interface MediaGalleryItem {
  id: string;
  tour_id: string;
  uploaded_by: string;
  file_url: string;
  caption?: string;
  media_type: "photo" | "document" | "video";
  created_at: string;
  tour?: Tour;
  uploader?: UserProfile;
}

export type CertificateType = "participation" | "excellence" | "leadership" | "mentor";

export interface Certificate {
  id: string;
  user_id: string;
  tour_id?: string;
  certificate_type: CertificateType;
  issued_by: string;
  notes?: string;
  issued_at: string;
  user?: UserProfile;
  tour?: Tour;
  issuer?: UserProfile;
}

export interface VolunteerProfile {
  id: string;
  user_id: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  state?: string;
  city?: string;
  institution?: string;
  course_year?: string;
  skills?: string[];
  languages?: string[];
  previous_visits: number;
  states_visited?: string[];
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_notes?: string;
  consent_given: boolean;
  consent_given_at?: string;
  availability_notes?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  blood_group?: string;
  aadhaar_number?: string;
  photo_url?: string;
  alternate_phone?: string;
  house_no?: string;
  street?: string;
  district?: string;
  pincode?: string;
  permanent_address_same: boolean;
  permanent_address?: string;
  current_status?: "student" | "working_professional" | "both" | "other";
  student_location?: string;
  qualification?: string;
  course_name?: string;
  stream?: string;
  edu_course_status?: "pursuing" | "completed";
  company_name?: string;
  work_location?: string;
  designation?: string;
  work_department?: string;
  years_experience?: number;
  emergency_contact_address?: string;
  has_allergies: boolean;
  allergies_detail?: string;
  has_medical_conditions: boolean;
  medical_conditions_detail?: string;
  takes_medicines: boolean;
  medicines_detail?: string;
  dietary_restrictions?: string[];
  certified_true: boolean;
  signature_name?: string;
  aadhaar_verified: boolean;
  aadhaar_verified_at?: string;
  aadhaar_verified_by?: string;
  parent_consent_url?: string;
  indemnity_bond_url?: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}


export interface DailyLog {
  id: string;
  tour_id: string;
  volunteer_id: string;
  log_date: string;
  activities: string;
  observations?: string;
  challenges?: string;
  created_at: string;
  updated_at: string;
  tour?: Tour;
  volunteer?: UserProfile;
}

// Volunteer journey modules

export interface RegistrationFee {
  id: string;
  volunteer_id: string;
  amount: number;
  status: "pending" | "paid" | "waived" | "refunded";
  payment_reference?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  volunteer?: UserProfile;
}

export type WorkshopType = "science" | "mathematics" | "exhibition_cultural" | "other";

export interface Workshop {
  id: string;
  title: string;
  workshop_type: WorkshopType;
  workshop_date: string;
  workshop_time?: string;
  hall_location?: string;
  trainer_id?: string;
  status: "scheduled" | "completed" | "cancelled";
  kit_ready: boolean;
  plan_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  trainer?: UserProfile;
}

export interface WorkshopAttendee {
  id: string;
  workshop_id: string;
  volunteer_id: string;
  attendance_status: "pending" | "present" | "absent" | "excused";
  missed_summary?: string;
  makeup_decision?: "pending" | "allowed" | "not_allowed";
  created_at: string;
  workshop?: Workshop;
  volunteer?: UserProfile;
}

export interface DemoEvaluationScores {
  content_delivery: number;
  hindi_communication: number;
  team_coordination: number;
  classroom_management: number;
  activity_flow: number;
  confidence: number;
  student_engagement: number;
}

export interface DemoEvaluation {
  id: string;
  volunteer_id: string;
  observer_id?: string;
  tour_id?: string;
  scores: DemoEvaluationScores;
  total_score?: number;
  remarks?: string;
  evaluated_at: string;
  volunteer?: UserProfile;
  observer?: UserProfile;
  tour?: Tour;
}

export interface LocalHost {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
  group_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: TourGroup;
}

export interface KitItem {
  id: string;
  name: string;
  category?: string;
  quantity_per_school: number;
  notes?: string;
  created_at: string;
}

export interface KitAssignment {
  id: string;
  group_id: string;
  school_count: number;
  packed: boolean;
  distributed: boolean;
  distributed_at?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: TourGroup;
}

export interface IdCard {
  id: string;
  volunteer_id: string;
  card_number: string;
  valid_from: string;
  valid_to: string;
  card_file_url?: string;
  issued_by: string;
  issued_at: string;
  volunteer?: UserProfile;
}

export interface TravelTicket {
  id: string;
  group_id: string;
  train_number?: string;
  pnr?: string;
  departure_station?: string;
  arrival_station?: string;
  departure_at?: string;
  arrival_at?: string;
  ticket_file_url?: string;
  confirmation_status: "pending" | "confirmed" | "cancelled";
  itinerary_approved: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: TourGroup;
}

export interface LocationUpdate {
  id: string;
  group_id: string;
  posted_by: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  status_type?: "current_location" | "train_delay" | "arrival_estimate" | "other";
  created_at: string;
  group?: TourGroup;
  poster?: UserProfile;
}

export interface ExpenseAdvance {
  id: string;
  group_id: string;
  amount: number;
  given_at: string;
  given_by: string;
  notes?: string;
  group?: TourGroup;
}

export interface Expense {
  id: string;
  group_id: string;
  submitted_by: string;
  category: "travel" | "accommodation" | "food" | "materials" | "miscellaneous" | "other";
  amount: number;
  bill_url?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  group?: TourGroup;
  submitter?: UserProfile;
}

export interface TourReport {
  id: string;
  tour_id: string;
  group_id?: string;
  submitted_by: string;
  summary: string;
  highlights?: string;
  challenges?: string;
  report_file_url?: string;
  status: "draft" | "submitted" | "approved";
  created_at: string;
  updated_at: string;
  tour?: Tour;
  group?: TourGroup;
  submitter?: UserProfile;
}
