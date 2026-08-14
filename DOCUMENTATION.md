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
11. [API Route Handlers](#api-route-handlers)
12. [Database Maintenance, Setup & Migrations](#database-maintenance-setup--migrations)

---

## Architecture Overview

**Gyan Setu** is built on **Next.js 16 (App Router)** utilizing standard React 19 Server Components for data fetching, Next.js Server Actions for data mutations, and Clerk Auth paired with Supabase PostgreSQL for backend persistence.

### High-Level Request Pipeline

```
Incoming Browser Request
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Next.js Middleware (`proxy.ts`)                         │
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

The application defines 6 roles (`types/index.ts` $\rightarrow$ `UserRole`):

1. **`enrollee`**: Newly registered user/student applying for tours or taking eligibility tests.
2. **`volunteer`**: Qualified applicant who passed the eligibility test and was approved by an admin.
3. **`group_core_member`**: A volunteer promoted (by an admin, per-group) to lead their tour group — can view fellow group members' details and score their demo evaluations, scoped to that group only.
4. **`admin`**: Program coordinator managing tours, groups, events, evaluations, and content.
5. **`super_admin`**: Executive admin possessing all `admin` privileges plus user role mutation (`/admin/super-admin`) and deletion rights.
6. **`earc_staff`**: Educational Activity & Resource Center field staff focused on school/student profile data collection.

### Authorization Guards (`lib/clerk/action-auth.ts`)

Every mutating Server Action must call an authorization helper before processing data:

```typescript
// Available Guards in lib/clerk/action-auth.ts
requireAdminUser();       // Grants access to 'admin' and 'super_admin'
requireSuperAdminUser();  // Grants access ONLY to 'super_admin'
requireVolunteerUser();   // Grants access to 'volunteer', 'admin', and 'super_admin'
requireEarcUser();        // Grants access to 'earc_staff', 'admin', and 'super_admin'
requireCoreMemberUser();  // Grants access to 'group_core_member', 'admin', and 'super_admin'
getAuthenticatedUser();   // Returns caller's user record and DB client if authenticated
assertGroupAccess(db, user, groupId); // Ensures volunteers access ONLY their assigned group
assertCoreMemberOverVolunteer(db, user, groupId, volunteerId); // Ensures a core member only views/scores volunteers within their own group
```

### Instant Session Revocation (`lib/clerk/revoke-sessions.ts`)

When a user's role is modified (e.g., test result approved promoting an enrollee to volunteer, demoting a volunteer back to enrollee, or modifying EARC staff roles), active Clerk JWT sessions are invalidated immediately using `clerkClient().sessions.revokeSession()`.

This forces the user's client browser to perform a silent token refresh / re-login, guaranteeing that outdated role claims in existing JWTs cannot bypass updated permissions.

Triggered during:
- `approveTestResult` & `demoteVolunteer` in [`actions/tests.ts`](./actions/tests.ts)
- `updateUserRole`, `setEarcStaffRole`, & `applyRoleUpdate` in [`actions/users.ts`](./actions/users.ts)

---

## Middleware & Route Protection

Global request filtering and route security are enforced in [`proxy.ts`](./proxy.ts) (Next.js's renamed middleware entry point):

1. **Global Sliding Window Rate Limiting**: All non-webhook HTTP requests are rate-limited via Upstash Redis (`200 requests / 1 minute` per client IP). Requests exceeding the quota return HTTP 429.
2. **Public Route Pass-Through**: Specified paths bypass authentication checks (`/`, `/sign-in`, `/sign-up`, `/gallery`, `/visits`, `/blog`, `/newsletter`, `/faq`, `/testimonial`, `/sponsor`, `/institution`, `/alumni`, `/api/webhooks(.*)`).
3. **Role-Based Redirect Rules**:
   - `/admin(.*)`: Restricted to `admin` and `super_admin`. *(Null-role JWT claims are allowed through to `(admin)/layout.tsx` to handle fresh database promotions before Clerk JWT refresh).*
   - `/volunteer(.*)`: Restricted to `volunteer`, `admin`, and `super_admin`.
   - `/enrollee(.*)`: Accessible to authenticated users, explicitly blocking `admin` and `super_admin`.
   - `/earc(.*)`: Restricted to `earc_staff`, `admin`, and `super_admin`. Unauthenticated or unauthorized attempts redirect to `/sign-in`.
   - `/core-member(.*)`: Restricted to `group_core_member`, `admin`, and `super_admin`.

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
| `/institution` | School/Institution Partnership Form | Unauthenticated |
| `/alumni` | Alumni Network Registration Form | Unauthenticated |

> `career_inquiries` exists in the database schema but has no form, action, or route wired up to it — there is no `/careers` page.

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
| `/enrollee/history`, `/enrollee/history/[tourId]` | Past tour history & detail view |
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
| `/volunteer/location` | Share current live location during an active tour |
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
| `/admin/tests`, `/tests/new`, `/tests/[id]`, `/tests/templates` | Test builder, manual grading, promotion approval & reusable templates |
| `/admin/forms`, `/forms/new`, `/forms/[id]`, `/forms/templates` | Dynamic JSON Form Builder, submission review & reusable templates |
| `/admin/students` | Enrollee applicant directory |
| `/admin/volunteers`, `/volunteers/[id]` | Volunteer directory & profile reviews |
| `/admin/profiles` | Full volunteer profile records (contact, education, emergency info) |
| `/admin/daily-logs` | Master review of all submitted daily logs |
| `/admin/tour-reports` | Review & approve end-of-tour reports |
| `/admin/school-reports`, `/school-reports/dashboard` | Browse school visit reports by tour/group/volunteer & a visual reporting dashboard |
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
| `/admin/super-admin` | Modify user roles (`super_admin` only) |
| `/admin/media` | Uploaded media library shared across the app |
| `/admin/blog`, `/newsletter`, `/gallery`, `/visits` | Public site content management |
| `/admin/testimonials`, `/sponsors`, `/institutions`, `/alumni` | Moderation & inquiry review |

### 6. EARC Field Panel (`(earc)/earc`)

| Path | Description |
| --- | --- |
| `/earc` | EARC Field Portal Dashboard |
| `/earc/dashboard` | Visual analytics dashboard over all submitted school & student data |
| `/earc/school-profile` | EARC School Profile form & field metrics submission |
| `/earc/student-profile` | EARC Student Profile registration form |
| `/earc/roles` | Grant or revoke EARC staff access for a user (`admin` / `super_admin` only) |

### 7. Core Member Portal (`(core-member)/core-member`)

| Path | Description |
| --- | --- |
| `/core-member` | Redirects to `/core-member/dashboard` |
| `/core-member/dashboard` | Current tour/group and its volunteers, plus past group assignments |
| `/core-member/volunteer/[volunteerId]` | A single group volunteer's detail & demo evaluation scoring (own group only) |

### 8. Dashboard Router (`/dashboard`)

`/dashboard/page.tsx` evaluates the caller's verified role and executes an immediate redirect:
- `admin` / `super_admin` $\rightarrow$ `/admin`
- `volunteer` $\rightarrow$ `/volunteer`
- `group_core_member` $\rightarrow$ `/core-member`
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
- **`volunteer_assignments`**: Confirms which volunteers are assigned to which tour (`tour_id`, `volunteer_id`, `role_description`).
- **`tour_end_demotions`**: Tracks volunteers auto-demoted to enrollee when their tour ends, so a later "reactivate for everyone" restores exactly those people (`tour_id`, `user_id`, `demoted_at`).

### Evaluation & Form Engine

- **`eligibility_tests`**: Test configurations (`tour_id`, `duration_minutes`, `passing_score`, `questions` [JSONB array], `status`, `is_template`).
- **`test_attempts`**: Student test submissions (`test_id`, `student_id`, `answers` [JSONB], `score`, `status`).
- **`dynamic_forms`**: Configurable form schema (`title`, `fields` [JSONB array], `target_role`, `status`, `category`).
- **`form_submissions`**: Completed form responses (`form_id`, `submitted_by`, `data` [JSONB]).

### Volunteer Operations & Reports

- **`volunteer_profiles`**: Comprehensive volunteer records (`phone`, `address`, `date_of_birth`, `skills`, `languages`, `aadhaar_number`, `photo_url`, `emergency_contact_*`, `medical_*`, `certified_true`).
- **`daily_logs`**: Log entries by volunteers (`tour_id`, `user_id`, `log_date`, `activities_conducted`, `key_achievements`, `challenges_faced`, `biggest_learning`, `participant_impact`).
- **`school_reports`**: Detailed reports per school visit (`group_id`, `school_name`, `school_type`, `location_category`, `medium_of_instruction`, `village_town`/`taluka_tehsil`/`district`/`state`/`pincode`, `principal_name`/`principal_mobile`, `coordinator_name`/`coordinator_mobile`, `sessions` [JSONB], reflection fields — `student_response`, `what_went_well`, `challenges_faced`, `solutions_adopted`, `suggestions_improvement`, `memorable_moment`, `overall_feedback` — `overall_rating`, `status`).
- **`tour_reports`**: End-of-tour summary reports (`tour_id`, `group_id`, `location_name`, `hosts` [JSONB], `logistics_scores` [JSONB], `unique_features`, `best_practices`, `overall_recommendation`, `status`).
- **`demo_evaluations`**: Evaluation scores for pre-tour demos (`volunteer_id`, `tour_id`, `scores` [JSONB 10-criteria scale], `remarks`, `status`).
- **`volunteer_observations`**: Free-text notes on a volunteer left by admins or their group's core member (`volunteer_id`, `group_id`, `author_id`, `note`). No volunteer-facing read access by design.

### Events & Workshop System

- **`events`** & **`event_attendees`**: Kattas, workshops, training sessions (`event_type` ['katta', 'melawa', 'training', 'workshop', ...], `event_date`, `status`, RSVPs).
- **`workshops`**, **`workshop_groups`**, & **`workshop_attendees`**: Standalone training workshops (`workshop_type`, `kit_ready`, `attendance_status`, `missed_summary`, `makeup_decision`).

### Logistics & Financial Management

- **`logistics`**: Per-tour logistics plan (`tour_id`, `travel_details` [JSONB], `accommodation_details` [JSONB], `kit_details` [JSONB], `itinerary`, `notes`). Defined in the schema but unused legacy — no action or page references it.
- **`expense_advances`**: Advance funds requested by group leaders (`group_id`, `amount`, `notes`, `status`).
- **`expenses`**: Itemized expense reimbursement claims (`group_id`, `category` ['travel', 'accommodation', 'food', 'materials', 'miscellaneous'], `subcategory`, `amount`, `bill_url`, `status`, `rejection_reason`).
- **`registration_fees`**: Fee payment records (`volunteer_id`, `amount`, `status` ['pending', 'paid', 'waived', 'refunded'], `payment_reference`).
- **`travel_tickets`**: Group travel arrangements (`group_id`, `train_number`, `pnr`, `departure_station`, `arrival_station`, `ticket_file_url`, `confirmation_status`).
- **`location_updates`**: Timestamped GPS/location log feed per group (`group_id`, `from_location`, `to_location`, `latitude`, `longitude`, `status_type`).
- **`volunteer_locations`**: Each volunteer's single latest live-sharing location, upserted in place (`user_id` unique, `latitude`, `longitude`, `accuracy`, `is_sharing`).
- **`kit_items`** & **`kit_assignments`**: Educational kit inventory and distribution status (`group_id`, `school_count`, `packed`, `distributed`).
- **`kit_packing_checks`**: Per-group checklist of which kit items have been physically packed (`group_id`, `kit_item_id`, `checked`, `checked_at`).
- **`local_hosts`**: Host family contact details (`group_id`, `name`, `phone`, `district`, `address`).

### EARC Field Data Tables

- **`earc_school_profiles`**: Structured school data collection (`academic_year`, `project`, `school_name`, `state`, `district`, `taluka_block`, `village_city`, `school_type`, `module`, `mode`, `student_strength` [JSONB], `num_teachers_involved`, `duration_per_session`, `num_sessions_conducted`, `total_input_hours`, `total_students`, `created_by`).
- **`earc_students`**: Individual student records (`first_name`, `middle_name`, `last_name`, `mobile_number`, `date_of_birth`, `gender`, `blood_group`, `apaar_id`, `aadhaar_number`, `created_by`).
- **`earc_files`**: Legacy file metadata table (retained for backward compatibility).

### Credentials & Engagement

- **`certificates`**: Digital certificates (`user_id`, `certificate_type`, `volunteer_code`, `state`, `place`, `duration_of_visit`).
- **`id_cards`**: Issued volunteer ID cards (`volunteer_id`, `tour_id`, `valid_from`, `valid_to`, `card_file_url`).
- **`notifications`**: User notifications (`user_id`, `title`, `message`, `read`, `type`).
- **`media_gallery`**: Volunteer-uploaded tour photos/documents/videos (`tour_id`, `uploaded_by`, `file_url`, `caption`, `media_type`).
- **`visits`**, **`gallery_categories`**/**`gallery_images`**, **`blog_posts`**, **`newsletters`**, **`testimonials`**, **`sponsor_inquiries`**, **`career_inquiries`**, **`institution_inquiries`**, **`alumni_registrations`**: Marketing, public content, and network registration tables. (`alumni_profiles` and `career_inquiries` are defined in the schema but unused legacy — no action or page references them; live alumni signups go through `alumni_registrations`.)

---

## Server Actions Module Registry

All Server Actions are located in `actions/` and operate under strict authorization guards:

| Module | Primary Exported Functions | Auth Requirement |
| --- | --- | --- |
| [`tours.ts`](./actions/tours.ts) | `createTour`, `updateTour`, `deleteTour`, `applyForTour`, `endTour`, `reactivateTour` | Admin / Enrollee |
| [`tests.ts`](./actions/tests.ts) | `createTest`, `submitTestAttempt`, `saveSubjectiveEvaluation`, `approveTestResult`, `demoteVolunteer` | Admin / Enrollee |
| [`forms.ts`](./actions/forms.ts) | `createForm`, `updateForm`, `deleteForm`, `submitForm` | Admin / Authenticated |
| [`groups.ts`](./actions/groups.ts) | `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember`, `getAllGroups`, `getGroupsForSelect`, `getGroupsByTour`, `getMyGroup`, `setGroupCoreMember`, `getMyCoreMemberAssignments` | Admin / Volunteer |
| [`core-member.ts`](./actions/core-member.ts) | `getVolunteerDetailForCoreMember`, `createDemoEvaluationForVolunteer`, `updateDemoEvaluationForVolunteer` | Group Core Member |
| [`daily-logs.ts`](./actions/daily-logs.ts) | `createDailyLog`, `updateDailyLog`, `getAllDailyLogs`, `uploadMedia` | Volunteer / Admin |
| [`school-reports.ts`](./actions/school-reports.ts) | `submitSchoolReport`, `updateSchoolReport`, `getGroupSchoolReports`, `getAllSchoolReports`, `getGroupMembersForSchoolReport` | Volunteer / Admin |
| [`tour-reports.ts`](./actions/tour-reports.ts) | `submitTourReport`, `updateTourReport`, `approveTourReport` | Volunteer / Admin |
| [`demo-evaluations.ts`](./actions/demo-evaluations.ts) | `createDemoEvaluation`, `updateDemoEvaluation`, `getAllDemoEvaluations` | Admin / Volunteer |
| [`finance.ts`](./actions/finance.ts) | `createExpenseAdvance`, `submitExpense`, `approveExpense`, `rejectExpense`, `sendBackExpense`, `resubmitExpense` | Volunteer / Admin |
| [`travel.ts`](./actions/travel.ts) | `createTravelTicket`, `postLocationUpdate`, `getLocationUpdatesForGroup` | Admin / Volunteer |
| [`locations.ts`](./actions/locations.ts) | `startSharingLocation`, `updateMyLocation`, `stopSharingLocation`, `getMySharingStatus`, `getGroupVolunteerLocations` | Volunteer / Admin |
| [`workshops.ts`](./actions/workshops.ts) | `createWorkshop`, `setWorkshopAttendance`, `reportWorkshopAttended`, `submitMissedWorkshopSummary`, `decideMakeup` | Admin / Volunteer |
| [`events.ts`](./actions/events.ts) | `createEvent`, `updateEvent`, `deleteEvent`, `getEvents`, `rsvpEvent`, `getMyEventRsvps`, `markAttended` | Admin / Volunteer |
| [`kits.ts`](./actions/kits.ts) | `createKitItem`, `updateKitItem`, `upsertKitAssignment`, `markKitDistributed`, `getKitChecklistForGroup`, `toggleKitChecklistItem` | Admin / Volunteer |
| [`local-hosts.ts`](./actions/local-hosts.ts) | `createLocalHost`, `updateLocalHost`, `deleteLocalHost`, `getAllLocalHosts`, `getLocalHostForMyGroup` | Admin / Volunteer |
| [`profiles.ts`](./actions/profiles.ts) | `upsertVolunteerProfile`, `getMyVolunteerProfile`, `getVolunteerProfileById`, `getAllVolunteerProfiles`, `setAadhaarVerified` | Volunteer / Admin |
| [`registration-fees.ts`](./actions/registration-fees.ts) | `createRegistrationFee`, `updateRegistrationFee`, `getAllRegistrationFees`, `getMyRegistrationFee` | Admin / Volunteer |
| [`earc.ts`](./actions/earc.ts) | `createSchoolProfile`, `createStudentProfile`, `getSchoolProfiles`, `getStudentProfiles`, `bulkCreateSchoolProfiles`, `bulkCreateStudentProfiles`, `exportSchoolProfilesCsv`, `exportStudentProfilesCsv` | EARC Staff / Admin |
| [`certificates.ts`](./actions/certificates.ts) | `issueCertificate`, `bulkIssueCertificates`, `revokeCertificate`, `getMyCertificates` | Admin / Volunteer |
| [`id-cards.ts`](./actions/id-cards.ts) | `createIdCard`, `bulkCreateIdCards`, `deleteIdCard`, `getMyIdCard` | Admin / Volunteer |
| [`gallery.ts`](./actions/gallery.ts) | `createCategory`, `deleteCategory`, `addImage`, `deleteImage` | Admin |
| [`blog.ts`](./actions/blog.ts) | `createPost`, `publishPost`, `deletePost` | Admin |
| [`newsletter.ts`](./actions/newsletter.ts) | `createNewsletter`, `publishNewsletter`, `deleteNewsletter` | Admin |
| [`visits.ts`](./actions/visits.ts) | `createVisit`, `updateVisitStatus`, `deleteVisit` | Admin |
| [`alumni-registration.ts`](./actions/alumni-registration.ts) | `submitAlumniRegistration`, `getAllAlumniRegistrations` | Public / Admin |
| [`public-forms.ts`](./actions/public-forms.ts) | `submitTestimonial`, `submitSponsorInquiry`, `submitInstitutionInquiry`, `approveTestimonial`, `declineTestimonial`, `deleteTestimonial` | Public / Admin |
| [`notifications.ts`](./actions/notifications.ts) | `createNotification`, `markNotificationRead`, `markAllNotificationsRead`, `notifyGroupMembers`, `sendEmail` | Authenticated |
| [`users.ts`](./actions/users.ts) | `getAllUsers`, `getEarcCandidates`, `updateUserRole`, `setEarcStaffRole`, `syncDeletedUsers`, `deleteUser` | Admin / Super Admin |

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

Supabase Storage is partitioned into 4 dedicated public buckets, all routed through the single allow-listed helper [`uploadFileToStorage()`](./actions/upload.ts) (no other file in the codebase calls `.storage.from(...)` directly):

| Bucket Name | Access | Purpose |
| --- | --- | --- |
| `media` | Any authenticated role | Tour photo/video/document uploads, and the generic file field on dynamic forms |
| `blog-covers` | Admin only | Cover artwork for public blog posts |
| `gallery-images` | Admin only | High-resolution photographs for public photo gallery |
| `newsletter-files` | Admin only | Published PDF newsletters |

`documents` and `earc-files` storage buckets are created by `schema.sql` (`insert into storage.buckets ...`) but are dead — no allow-listed helper writes to either. The `earc_files` table exists in the schema but is unused legacy. Expense receipts (`bill_url`), travel tickets (`ticket_file_url`), and ID card files (`card_file_url`) are not uploaded to Supabase Storage at all — they're plain external-URL text fields (or, for ID cards, generated client-side and downloaded directly); profile photos are the one exception, uploaded through the `media` bucket.

---

## Caching & Rate Limiting Strategy

- **Edge Global Rate Limiting**: Managed via `@upstash/ratelimit` in `proxy.ts` using sliding windows (200 requests/min per IP).
- **Test Submission Rate Limiting**: Per-user rate limiting on eligibility test submissions to prevent brute-force automated test attempts.
- **Query Result Caching**: [`lib/redis/client.ts`](./lib/redis/client.ts) exposes `getCached()`/`setCached()`/`invalidateCache()` over Upstash Redis with named `CACHE_KEYS` (`dashboardStats`, `activeTours`, `activeForms`, `rankings(tourId)`) and tiered `CACHE_TTL` (60/300/3600s). Used by `GET /api/tours` and the admin dashboard page to avoid refetching on every request.
- **Server Cache Invalidation**: Server Actions invoke `revalidatePath()` upon mutating data to refresh cached Next.js route components instantly.

---

## Email & Notification Infrastructure

- **Transactional Email**: Handled via the [Resend](https://resend.com/) API. Most callers use `sendEmail()` in [`actions/notifications.ts`](./actions/notifications.ts), which rate-limits per-user and per-IP before sending. [`actions/alumni-registration.ts`](./actions/alumni-registration.ts) instead uses the [`lib/resend/client.ts`](./lib/resend/client.ts) wrapper, which gates all sends behind an in-file `EMAIL_ENABLED` flag and supplies a default `FROM_EMAIL`. Triggered on tour application status changes, role updates, and alumni registration confirmations.
- **In-App Notification Feed**: Stored in the `notifications` table and rendered via `/api/notifications`.

---

## API Route Handlers

In addition to Server Actions, a small set of `GET`-only REST endpoints under `app/api/` serve data to client components that need imperative fetching (e.g. map widgets, select-option loaders):

| Route | Description | Auth |
| --- | --- | --- |
| `GET /api/tours` | List tours, optionally filtered by `status`; Redis-cached for the public "open" view | Authenticated (non-open statuses require volunteer/admin/super_admin) |
| `GET /api/tours/[id]` | Single tour summary fields | Authenticated |
| `GET /api/volunteers` | Volunteer directory for select inputs, optionally filtered by `tourId` and `includeEnrollees` | Admin / Super Admin |
| `GET /api/groups/[groupId]` | Tour group detail with members, mentor, and parent tour | Authenticated |
| `GET /api/notifications` | Caller's latest 20 notifications | Authenticated |
| `/api/webhooks/clerk` | Clerk user lifecycle webhook (create/update/delete sync to `users` table), Svix-verified | Public (signature-verified) |

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
