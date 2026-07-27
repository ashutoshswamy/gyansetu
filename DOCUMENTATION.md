# Gyan Setu — Technical Architecture & System Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication, RBAC & Session Management](#authentication-rbac--session-management)
3. [Middleware & Route Protection](#middleware--route-protection)
4. [Route Directory](#route-directory)
5. [Database Schema Reference](#database-schema-reference)
6. [Server Actions Module Registry](#server-actions-module-registry)
7. [EARC Field Operations System](#earc-field-operations-system)
8. [Storage Buckets & Media Management](#storage-buckets--media-management)
9. [Caching & Rate Limiting Strategy](#caching--rate-limiting-strategy)
10. [Email & Notification Infrastructure](#email--notification-infrastructure)
11. [Database Maintenance, Setup & Migrations](#database-maintenance-setup--migrations)

---

## Architecture Overview

**Gyan Setu** is built on **Next.js 16 (App Router)** utilizing standard React 19 Server Components for data fetching, Next.js Server Actions for data mutations, and Clerk Auth paired with Supabase PostgreSQL for backend persistence.

### High-Level Request Pipeline

```
Incoming Browser Request
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Next.js Middleware (`middleware.ts`)                   │
│  ├─ 1. Upstash Redis Global Rate Limit (200 req/min)   │
│  ├─ 2. Clerk Authentication Session Resolver          │
│  └─ 3. Role-Based Route Matcher (RBAC Guard)           │
└──────────────────────────┬─────────────────────────────┘
                           │ Passed
                           ▼
┌────────────────────────────────────────────────────────┐
│ App Router Layouts & Server Components                 │
│  ├─ Direct DB Fetching via Supabase Server Client      │
│  └─ Role verification & rendering                      │
└──────────────────────────┬─────────────────────────────┘
                           │ Interactive UI & Form Submit
                           ▼
┌────────────────────────────────────────────────────────┐
│ Server Actions (`actions/*.ts`)                        │
│  ├─ 1. Action Auth Guard (`lib/clerk/action-auth.ts`)  │
│  ├─ 2. Input Validation via Zod Schemas                │
│  ├─ 3. Group Scope Assertion (`assertGroupAccess`)      │
│  ├─ 4. Supabase Service Role Query execution           │
│  ├─ 5. Trigger Session Invalidation (if role changes)  │
│  └─ 6. Cache Revalidation (`revalidatePath`)           │
└────────────────────────────────────────────────────────┘
```

### Key Architectural Concepts

- **Server-First Data Fetching**: Page components directly invoke `createServerClient()` from [`lib/supabase/server.ts`](./lib/supabase/server.ts) to perform database queries securely without client-side API roundtrips.
- **Type-Safe Mutations via Server Actions**: All state mutations (create, update, delete, status transitions) are exported as `"use server"` functions inside `actions/`.
- **Dual-Source Role Fallback & Healing**: Primary role authority is stored in Clerk user metadata (`publicMetadata.role`) and embedded in the JWT (`sessionClaims.metadata.role`). If the metadata claim is absent, `action-auth.ts` queries the Supabase `users` table, syncing back to Clerk or self-healing missing records.

---

## Authentication, RBAC & Session Management

### Role Hierarchy & User Types

The application defines 5 roles (`types/index.ts` $\rightarrow$ `UserRole`):

1. **`enrollee`**: Newly registered user/student applying for tours or taking eligibility tests.
2. **`volunteer`**: Qualified applicant who passed the eligibility test and was approved by an admin.
3. **`admin`**: Program coordinator managing tours, groups, events, evaluations, and content.
4. **`super_admin`**: Executive admin possessing all `admin` privileges plus user role mutation (`/admin/super-admin`) and deletion rights.
5. **`earc_staff`**: Educational Activity & Resource Center field staff focused on school/student profile data collection.

### Authorization Guards (`lib/clerk/action-auth.ts`)

Every mutating Server Action must call an authorization helper before processing data:

```typescript
// Available Guards in lib/clerk/action-auth.ts
requireAdminUser();       // Grants access to 'admin' and 'super_admin'
requireSuperAdminUser();  // Grants access ONLY to 'super_admin'
requireVolunteerUser();   // Grants access to 'volunteer', 'admin', and 'super_admin'
requireEarcUser();        // Grants access to 'earc_staff', 'admin', and 'super_admin'
getAuthenticatedUser();   // Returns caller's user record and DB client if authenticated
assertGroupAccess(db, user, groupId); // Ensures volunteers access ONLY their assigned group
```

### Instant Session Revocation (`lib/clerk/revoke-sessions.ts`)

When a user's role is modified (e.g., test result approved promoting an enrollee to volunteer, demoting a volunteer back to enrollee, or modifying EARC staff roles), active Clerk JWT sessions are invalidated immediately using `clerkClient().sessions.revokeSession()`.

This forces the user's client browser to perform a silent token refresh / re-login, guaranteeing that outdated role claims in existing JWTs cannot bypass updated permissions.

Triggered during:
- `approveTestResult` & `demoteVolunteer` in [`actions/tests.ts`](./actions/tests.ts)
- `updateUserRole`, `setEarcStaffRole`, & `applyRoleUpdate` in [`actions/users.ts`](./actions/users.ts)

---

## Middleware & Route Protection

Global request filtering and route security are enforced in [`middleware.ts`](./middleware.ts):

1. **Global Sliding Window Rate Limiting**: All non-webhook HTTP requests are rate-limited via Upstash Redis (`200 requests / 1 minute` per client IP). Requests exceeding the quota return HTTP 429.
2. **Public Route Pass-Through**: Specified paths bypass authentication checks (`/`, `/sign-in`, `/sign-up`, `/gallery`, `/visits`, `/blog`, `/newsletter`, `/faq`, `/testimonial`, `/sponsor`, `/careers`, `/institution`, `/alumni`, `/api/webhooks(.*)`).
3. **Role-Based Redirect Rules**:
   - `/admin(.*)`: Restricted to `admin` and `super_admin`. *(Null-role JWT claims are allowed through to `(admin)/layout.tsx` to handle fresh database promotions before Clerk JWT refresh).*
   - `/volunteer(.*)`: Restricted to `volunteer`, `admin`, and `super_admin`.
   - `/enrollee(.*)`: Accessible to authenticated users, explicitly blocking `admin` and `super_admin`.
   - `/earc(.*)`: Restricted to `earc_staff`, `admin`, and `super_admin`. Unauthenticated or unauthorized attempts redirect to `/sign-in`.

---

## Route Directory

### 1. Public Routes (`(public)`)

| Path | Description | Access |
| --- | --- | --- |
| `/` | Public Landing Page | Unauthenticated |
| `/blog`, `/blog/[slug]` | Blog Listing & Detailed Posts | Unauthenticated |
| `/gallery` | Photo Gallery organized by category | Unauthenticated |
| `/visits` | Public Visits & Tour Showcase | Unauthenticated |
| `/faq` | Frequently Asked Questions | Unauthenticated |
| `/testimonial` | Testimonials & Submission Form | Unauthenticated |
| `/newsletter` | Newsletter Downloads & Archive | Unauthenticated |
| `/sponsor` | Sponsor Inquiry Form | Unauthenticated |
| `/careers` | Career & Volunteer Inquiry Form | Unauthenticated |
| `/institution` | School/Institution Partnership Form | Unauthenticated |
| `/alumni` | Alumni Network Registration Form | Unauthenticated |

### 2. Auth Routes (`(auth)`)

| Path | Description |
| --- | --- |
| `/sign-in` | Clerk Sign-In hosted portal |
| `/sign-up` | Clerk Sign-Up hosted portal |

### 3. Enrollee Portal (`(enrollee)/enrollee`)

| Path | Description |
| --- | --- |
| `/enrollee` | Enrollee Dashboard |
| `/enrollee/tours`, `/enrollee/tours/[id]` | Open Tours listing & application page |
| `/enrollee/tests`, `/enrollee/tests/[id]` | Timed Eligibility Tests portal |
| `/enrollee/forms`, `/enrollee/forms/[id]` | Assigned Dynamic Forms & submission |
| `/enrollee/profile` | Personal Enrollee Profile |

### 4. Volunteer Panel (`(volunteer)/volunteer`)

| Path | Description |
| --- | --- |
| `/volunteer` | Volunteer Dashboard |
| `/volunteer/tours` | My Assigned Tours |
| `/volunteer/forms`, `/volunteer/forms/[id]` | Volunteer Form Submissions |
| `/volunteer/events` | Events & Kattas (RSVP & Attendance) |
| `/volunteer/workshops` | Workshop Schedule & Missed Workshop Summary submission |
| `/volunteer/groups` | My Group Overview & Team Members |
| `/volunteer/daily-log` | Daily Log submission (word count validated) |
| `/volunteer/school-reports` | Group School Visit Reports |
| `/volunteer/tour-report` | End-of-Tour Comprehensive Report |
| `/volunteer/media` | Tour Photo & Media Uploads |
| `/volunteer/expenses` | Expense Advances & Itemized Expense Claims |
| `/volunteer/travel` | PNR Travel Tickets & Live Location Updates |
| `/volunteer/registration-fee` | Personal Registration Fee payment status |
| `/volunteer/demo-evaluations` | Assigned Demo Evaluations |
| `/volunteer/certificates`, `/volunteer/certificates/[id]` | Earned Certificates & PDF Viewer |
| `/volunteer/id-card` | Official Volunteer ID Card generator |
| `/volunteer/profile` | Volunteer Profile & Aadhaar Verification Status |

### 5. Admin Console (`(admin)/admin`)

| Path | Description |
| --- | --- |
| `/admin` | Main Admin Executive Dashboard |
| `/admin/analytics` | Analytical Metrics & System Performance |
| `/admin/tours`, `/tours/new`, `/tours/[id]` | Tour Lifecycle Management |
| `/admin/groups`, `/groups/new`, `/groups/[groupId]` | Tour Group creation & mentor assignments |
| `/admin/tests`, `/tests/new`, `/tests/[id]` | Test builder, manual grading & promotion approval |
| `/admin/forms`, `/forms/new`, `/forms/[id]` | Dynamic JSON Form Builder & submission review |
| `/admin/students` | Enrollee applicant directory |
| `/admin/volunteers`, `/volunteers/[id]` | Volunteer directory & profile reviews |
| `/admin/daily-logs` | Master review of all submitted daily logs |
| `/admin/tour-reports` | Review & approve end-of-tour reports |
| `/admin/events`, `/events/new` | Event & Katta scheduling |
| `/admin/workshops`, `/workshops/new` | Workshop scheduling & makeup decision review |
| `/admin/demo-evaluations` | Pre-tour demo evaluation scoring |
| `/admin/finance` | Master finance console (Advances & Expense approvals) |
| `/admin/registration-fees` | Registration fee tracking & waiver management |
| `/admin/travel`, `/travel/new` | Travel ticket booking management |
| `/admin/locations` | Live group location map tracker |
| `/admin/kits` | Kit inventory management & group distribution |
| `/admin/id-cards`, `/id-cards/new` | ID card generation & issuance |
| `/admin/local-hosts` | Local host family directory |
| `/admin/certificates`, `/certificates/new` | Digital Certificate issuing console |
| `/admin/earc-staff` | Assign or revoke EARC staff role |
| `/admin/super-admin` | Modify user roles (`super_admin` only) |
| `/admin/blog`, `/newsletter`, `/gallery`, `/visits` | Public site content management |
| `/admin/testimonials`, `/sponsors`, `/careers`, `/institutions`, `/alumni` | Moderation & inquiry review |

### 6. EARC Field Panel (`(earc)/earc`)

| Path | Description |
| --- | --- |
| `/earc` | EARC Field Portal Dashboard |
| `/earc/school-profile` | EARC School Profile form & field metrics submission |
| `/earc/student-profile` | EARC Student Profile registration form |

### 7. Dashboard Router (`/dashboard`)

`/dashboard/page.tsx` evaluates the caller's verified role and executes an immediate redirect:
- `admin` / `super_admin` $\rightarrow$ `/admin`
- `volunteer` $\rightarrow$ `/volunteer`
- `earc_staff` $\rightarrow$ `/earc`
- `enrollee` / default $\rightarrow$ `/enrollee`

---

## Database Schema Reference

All tables reside in the Supabase PostgreSQL `public` schema ([`lib/supabase/schema.sql`](./lib/supabase/schema.sql)).

### Core Identity & Tour Management

- **`users`**: Synced from Clerk Auth. Stores user identity (`clerk_id`, `email`, `name`, `role`, `avatar_url`).
- **`tours`**: Defines student exchange tours (`title`, `destination`, `start_date`, `end_date`, `capacity`, `status`, `eligibility_test_id`, `created_by`).
- **`tour_groups`**: Sub-groups created within a tour (`tour_id`, `name`, `state_allocated`, `mentor_id`, `notes`).
- **`tour_group_members`**: Join table mapping volunteers to groups (`group_id`, `user_id`, `role_in_group`).
- **`tour_applications`**: Applications filed by enrollees (`tour_id`, `student_id`, `status`, `test_score`).

### Evaluation & Form Engine

- **`eligibility_tests`**: Test configurations (`tour_id`, `duration_minutes`, `passing_score`, `questions` [JSONB array], `status`, `is_template`).
- **`test_attempts`**: Student test submissions (`test_id`, `student_id`, `answers` [JSONB], `score`, `status`).
- **`dynamic_forms`**: Configurable form schema (`title`, `fields` [JSONB array], `target_role`, `status`, `category`).
- **`form_submissions`**: Completed form responses (`form_id`, `submitted_by`, `data` [JSONB]).

### Volunteer Operations & Reports

- **`volunteer_profiles`**: Comprehensive volunteer records (`phone`, `address`, `date_of_birth`, `skills`, `languages`, `aadhaar_number`, `photo_url`, `emergency_contact_*`, `medical_*`, `certified_true`).
- **`daily_logs`**: Log entries by volunteers (`tour_id`, `user_id`, `log_date`, `activities_conducted`, `key_achievements`, `challenges_faced`, `biggest_learning`, `participant_impact`).
- **`school_reports`**: Detailed reports per school visit (`group_id`, `school_name`, `school_type`, `location_category`, `medium_of_instruction`, `address`, `principal_*`, `sessions` [JSONB], `reflection_*`, `status`).
- **`tour_reports`**: End-of-tour summary reports (`tour_id`, `group_id`, `location_name`, `hosts` [JSONB], `logistics_scores` [JSONB], `unique_features`, `best_practices`, `overall_recommendation`, `status`).
- **`demo_evaluations`**: Evaluation scores for pre-tour demos (`volunteer_id`, `tour_id`, `scores` [JSONB 10-criteria scale], `remarks`, `status`).

### Events & Workshop System

- **`events`** & **`event_attendees`**: Kattas, workshops, training sessions (`event_type` ['katta', 'melawa', 'training', 'workshop', ...], `event_date`, `status`, RSVPs).
- **`workshops`**, **`workshop_groups`**, & **`workshop_attendees`**: Standalone training workshops (`workshop_type`, `kit_ready`, `attendance_status`, `missed_summary`, `makeup_decision`).

### Logistics & Financial Management

- **`expense_advances`**: Advance funds requested by group leaders (`group_id`, `amount`, `notes`, `status`).
- **`expenses`**: Itemized expense reimbursement claims (`group_id`, `category` ['travel', 'accommodation', 'food', 'materials', 'miscellaneous'], `subcategory`, `amount`, `bill_url`, `status`, `rejection_reason`).
- **`registration_fees`**: Fee payment records (`volunteer_id`, `amount`, `status` ['pending', 'paid', 'waived', 'refunded'], `payment_reference`).
- **`travel_tickets`**: Group travel arrangements (`group_id`, `train_number`, `pnr`, `departure_station`, `arrival_station`, `ticket_file_url`, `confirmation_status`).
- **`location_updates`**: Live GPS/location log feeds (`group_id`, `from_location`, `to_location`, `latitude`, `longitude`, `status_type`).
- **`kit_items`** & **`kit_assignments`**: Educational kit inventory and distribution status (`group_id`, `school_count`, `packed`, `distributed`).
- **`local_hosts`**: Host family contact details (`group_id`, `name`, `phone`, `district`, `address`).

### EARC Field Data Tables

- **`earc_school_profiles`**: Structured school data collection (`academic_year`, `project`, `school_name`, `state`, `district`, `taluka_block`, `village_city`, `school_type`, `module`, `mode`, `student_strength` [JSONB], `num_teachers_involved`, `duration_per_session`, `num_sessions_conducted`, `total_input_hours`, `total_students`, `created_by`).
- **`earc_students`**: Individual student records (`first_name`, `middle_name`, `last_name`, `mobile_number`, `date_of_birth`, `gender`, `blood_group`, `apaar_id`, `aadhaar_number`, `created_by`).
- **`earc_files`**: Legacy file metadata table (retained for backward compatibility).

### Credentials & Engagement

- **`certificates`**: Digital certificates (`user_id`, `certificate_type`, `volunteer_code`, `state`, `place`, `duration_of_visit`).
- **`id_cards`**: Issued volunteer ID cards (`volunteer_id`, `tour_id`, `valid_from`, `valid_to`, `card_file_url`).
- **`notifications`**: User notifications (`user_id`, `title`, `message`, `read`, `type`).
- **`visits`**, **`gallery_*`**, **`blog_posts`**, **`newsletters`**, **`testimonials`**, **`sponsor_inquiries`**, **`career_inquiries`**, **`institution_inquiries`**, **`alumni_*`**: Marketing, public content, and network registration tables.

---

## Server Actions Module Registry

All Server Actions are located in `actions/` and operate under strict authorization guards:

| Module | Primary Exported Functions | Auth Requirement |
| --- | --- | --- |
| [`tours.ts`](./actions/tours.ts) | `createTour`, `updateTour`, `deleteTour`, `applyForTour` | Admin / Enrollee |
| [`tests.ts`](./actions/tests.ts) | `createTest`, `submitTestAttempt`, `saveSubjectiveEvaluation`, `approveTestResult`, `demoteVolunteer` | Admin / Enrollee |
| [`forms.ts`](./actions/forms.ts) | `createForm`, `updateForm`, `deleteForm`, `submitForm` | Admin / Authenticated |
| [`groups.ts`](./actions/groups.ts) | `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `getMyGroup` | Admin / Volunteer |
| [`daily-logs.ts`](./actions/daily-logs.ts) | `createDailyLog`, `updateDailyLog`, `getAllDailyLogs`, `uploadMedia` | Volunteer / Admin |
| [`school-reports.ts`](./actions/school-reports.ts) | `submitSchoolReport`, `updateSchoolReport`, `getGroupSchoolReports` | Volunteer / Admin |
| [`tour-reports.ts`](./actions/tour-reports.ts) | `submitTourReport`, `updateTourReport`, `approveTourReport` | Volunteer / Admin |
| [`demo-evaluations.ts`](./actions/demo-evaluations.ts) | `createDemoEvaluation`, `updateDemoEvaluation`, `getAllDemoEvaluations` | Admin / Volunteer |
| [`finance.ts`](./actions/finance.ts) | `createExpenseAdvance`, `submitExpense`, `approveExpense`, `rejectExpense`, `sendBackExpense` | Volunteer / Admin |
| [`travel.ts`](./actions/travel.ts) | `createTravelTicket`, `postLocationUpdate`, `getLocationUpdatesForGroup` | Admin / Volunteer |
| [`workshops.ts`](./actions/workshops.ts) | `createWorkshop`, `setWorkshopAttendance`, `submitMissedWorkshopSummary`, `decideMakeup` | Admin / Volunteer |
| [`earc.ts`](./actions/earc.ts) | `createSchoolProfile`, `createStudentProfile`, `exportSchoolProfilesCsv`, `exportStudentProfilesCsv` | EARC Staff / Admin |
| [`certificates.ts`](./actions/certificates.ts) | `issueCertificate`, `revokeCertificate`, `getMyCertificates` | Admin / Volunteer |
| [`id-cards.ts`](./actions/id-cards.ts) | `createIdCard`, `deleteIdCard`, `getMyIdCard` | Admin / Volunteer |
| [`users.ts`](./actions/users.ts) | `getAllUsers`, `updateUserRole`, `setEarcStaffRole`, `syncDeletedUsers`, `deleteUser` | Admin / Super Admin |

---

## EARC Field Operations System

The EARC module is specifically designed for field data gathering:

1. **School Profile Capture (`createSchoolProfile`)**:
   - Accepts detailed school attributes (academic year, project, location hierarchy, module, mode, medium, session details).
   - Validates `student_strength` breakdown per grade (boys/girls).
   - **Automated Metric Computation**: Calculates `total_students` ($\sum \text{boys} + \text{girls}$) and `total_input_hours` ($\text{duration} \times \text{num\_sessions}$) server-side before insertion.
2. **Student Profile Capture (`createStudentProfile`)**:
   - Captures demographic details, contact numbers, APAAR ID, and Aadhaar numbers.
3. **Admin CSV Export Functions**:
   - `exportSchoolProfilesCsv()` & `exportStudentProfilesCsv()` produce properly formatted CSV file strings with header rows, escaping double quotes and commas according to RFC 4180 standards.

---

## Storage Buckets & Media Management

Supabase Storage is partitioned into 6 dedicated public buckets:

| Bucket Name | Public Access | Purpose |
| --- | --- | --- |
| `media` | Yes | Legacy tour media and general uploads |
| `blog-covers` | Yes | Cover artwork for public blog posts |
| `gallery-images` | Yes | High-resolution photographs for public photo gallery |
| `newsletter-files` | Yes | Published PDF newsletters |
| `earc-files` | Yes | Legacy EARC attachments |
| `documents` | Yes | Expense receipts, travel tickets, profile photographs, ID card assets |

Direct uploads are handled using [`actions/upload.ts`](./actions/upload.ts) or Supabase client storage helpers.

---

## Caching & Rate Limiting Strategy

- **Edge Global Rate Limiting**: Managed via `@upstash/ratelimit` in `middleware.ts` using sliding windows (200 requests/min per IP).
- **Test Submission Rate Limiting**: Per-user rate limiting on eligibility test submissions to prevent brute-force automated test attempts.
- **Server Cache Invalidation**: Server Actions invoke `revalidatePath()` upon mutating data to refresh cached Next.js route components instantly.

---

## Email & Notification Infrastructure

- **Transactional Email**: Handled via the [Resend](https://resend.com/) API using `sendEmail()` in [`actions/notifications.ts`](./actions/notifications.ts). Triggered on tour application status changes and role updates.
- **In-App Notification Feed**: Stored in the `notifications` table and rendered via `/api/notifications`.

---

## Database Maintenance, Setup & Migrations

### 1. Initial Database Setup

To provision a fresh database instance:
1. Open the Supabase SQL Editor for your project.
2. Copy and execute the complete [`lib/supabase/schema.sql`](./lib/supabase/schema.sql) file.

### 2. Idempotent Schema Design

`schema.sql` is designed to be completely idempotent:
- Tables are defined using `create table if not exists`.
- Schema upgrades are appended as marked `-- MIGRATION: ...` blocks using `alter table ... drop constraint if exists` followed by `add constraint`.
- Re-running `schema.sql` on an existing database will apply missing columns and constraints without dropping data.

### 3. Database Reset Procedure

> [!CAUTION]
> Running reset.sql will permanently delete all stored data, tables, types, and functions.

To wipe and re-initialize a database:
1. Execute [`lib/supabase/reset.sql`](./lib/supabase/reset.sql) in the Supabase SQL Editor.
2. Re-run [`lib/supabase/schema.sql`](./lib/supabase/schema.sql).
