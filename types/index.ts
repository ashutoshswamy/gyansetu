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
  tour_id: string;
  duration_minutes: number;
  passing_score: number;
  questions: TestQuestion[];
  status: "draft" | "active" | "closed";
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
