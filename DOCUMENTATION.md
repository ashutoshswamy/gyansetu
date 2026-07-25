# Gyan Setu — Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & RBAC](#authentication--rbac)
3. [Route Structure](#route-structure)
4. [Database Schema](#database-schema)
5. [Server Actions](#server-actions)
6. [API Routes](#api-routes)
7. [Feature Modules](#feature-modules)
8. [Storage Buckets](#storage-buckets)
9. [Caching Strategy](#caching-strategy)
10. [Email](#email)
11. [EARC Panel](#earc-panel)
12. [Deployment](#deployment)
13. [DB Maintenance](#db-maintenance)

---

## Architecture Overview

Next.js 16 App Router with server components by default. Data fetching happens in server components via the Supabase server client. Mutations go through Server Actions. Client components are used only for interactivity (forms, uploads, real-time UI).

```
Browser → Clerk Auth → Next.js Middleware (RBAC + global rate limit) → App Router
                                                      ├─ Server Components → Supabase (direct)
                                                      ├─ Server Actions → Supabase + Clerk API
                                                      └─ API Routes → Supabase / Clerk webhooks
```

---

## Authentication & RBAC

### Clerk

All auth is handled by Clerk. Roles are stored in `publicMetadata.role` on the Clerk user object and synced to the `users` table in Supabase.

Role is read from the Clerk JWT `sessionClaims.metadata.role` in middleware and layout files. If the Clerk JWT has no role, layouts fall back to querying Supabase and sync back to Clerk.

Valid roles (`types/index.ts` → `UserRole`): `enrollee`, `volunteer`, `admin`, `super_admin`, `earc_staff`.

### Middleware (`middleware.ts`)

A global Upstash rate limit (200 req/min per IP) applies to every non-webhook request. Route matchers then enforce role access:

| Route pattern | Allowed roles |
|---|---|
| `/admin(.*)` | `admin`, `super_admin` (null/undefined role passes through here; `(admin)/layout.tsx` re-verifies against Supabase for manually-promoted admins whose JWT hasn't synced yet) |
| `/volunteer(.*)` | `volunteer`, `admin`, `super_admin` |
| `/enrollee(.*)` | any authenticated user except `admin`, `super_admin` |
| `/earc(.*)` | `earc_staff`, `admin`, `super_admin` |
| Public routes (`/`, `/sign-in`, `/sign-up`, `/gallery`, `/visits`, `/blog`, `/newsletter`, `/faq`, `/testimonial`, `/sponsor`, `/careers`, `/institution`, `/alumni`, `/api/webhooks(.*)`) | unauthenticated allowed |

### Role Helpers (`lib/clerk/`)

| File | Exports |
|---|---|
| `roles.ts` | `getUserRole()`, `isEnrolleeRole()` |
| `action-auth.ts` | `requireAdminUser()`, `requireSuperAdminUser()`, `requireVolunteerUser()`, `requireEarcUser()`, `getAuthenticatedUser()`, `assertGroupAccess()` |
| `revoke-sessions.ts` | `revokeAllUserSessions(clerkUserId)` |

### Session Revocation

When a user's role is promoted or demoted, all their active Clerk sessions are revoked immediately via `revokeAllUserSessions()`. This forces re-login so the new role appears in the JWT. Applied in:

- `actions/tests.ts` — `approveTestResult` (enrollee → volunteer) and `demoteVolunteer` (volunteer → enrollee)
- `actions/users.ts` — `updateUserRole` and `setEarcStaffRole` (super admin / admin changing a user's role)

### Supabase Sync

The Clerk webhook (`/api/webhooks/clerk`) syncs user creation/updates to the `users` table. Layout files also perform an upsert on every render as a fallback.

---

## Route Structure

### Public Routes (`(public)`)

| Path | Description |
|---|---|
| `/` | Landing page |
| `/blog`, `/blog/[slug]` | Blog listing / post |
| `/gallery` | Photo gallery |
| `/visits` | Past visits |
| `/faq` | FAQ |
| `/testimonial` | Testimonials |
| `/newsletter` | Newsletter archive |
| `/sponsor` | Sponsor inquiry |
| `/careers` | Career inquiry |
| `/institution` | Institution/school inquiry |
| `/alumni` | Alumni registration |

### Auth Routes (`(auth)`)

| Path | Description |
|---|---|
| `/sign-in` | Clerk sign-in (hosted UI) |
| `/sign-up` | Clerk sign-up (hosted UI) |

### Enrollee Portal (`(enrollee)/enrollee`)

| Path | Description |
|---|---|
| `/enrollee` | Dashboard |
| `/enrollee/tours`, `/enrollee/tours/[id]` | Browse open tours / detail + apply |
| `/enrollee/tests`, `/enrollee/tests/[id]` | My eligibility tests / take test |
| `/enrollee/forms`, `/enrollee/forms/[id]` | My forms / fill dynamic form |
| `/enrollee/profile` | Profile |

### Volunteer Panel (`(volunteer)/volunteer`)

| Path | Description |
|---|---|
| `/volunteer` | Dashboard |
| `/volunteer/tours` | My tours |
| `/volunteer/forms`, `/volunteer/forms/[id]` | Tasks & forms / fill form |
| `/volunteer/events` | Events |
| `/volunteer/workshops` | Workshops (attendance, makeup) |
| `/volunteer/groups` | My group |
| `/volunteer/daily-log` | Daily log entries |
| `/volunteer/school-reports` | Group school reports |
| `/volunteer/tour-report` | End-of-tour report |
| `/volunteer/media` | Upload media |
| `/volunteer/expenses` | Expense claims |
| `/volunteer/travel` | Travel tickets & location updates |
| `/volunteer/registration-fee` | Registration fee status |
| `/volunteer/demo-evaluations` | Assigned demo evaluations |
| `/volunteer/certificates`, `/volunteer/certificates/[id]` | My certificates |
| `/volunteer/id-card` | My ID card |
| `/volunteer/profile` | Volunteer profile |

### Admin Console (`(admin)/admin`)

| Path | Description |
|---|---|
| `/admin` | Dashboard |
| `/admin/analytics` | Analytics |
| `/admin/tours`, `/tours/new`, `/tours/[id]`, `/tours/[id]/edit` | Manage tours |
| `/admin/visits`, `/visits/new` | Manage visits |
| `/admin/groups`, `/groups/new`, `/groups/[groupId]` | Tour groups |
| `/admin/events`, `/events/new`, `/events/[id]/edit` | Events |
| `/admin/workshops`, `/workshops/new`, `/workshops/[id]` | Workshops |
| `/admin/tests`, `/tests/new`, `/tests/[id]`, `/tests/[id]/edit`, `/tests/templates` | Eligibility tests + grade/approve results |
| `/admin/forms`, `/forms/new`, `/forms/[id]/edit`, `/forms/[id]/submissions`, `/forms/templates` | Dynamic forms |
| `/admin/students` | Enrolled users |
| `/admin/volunteers`, `/volunteers/[id]` | Volunteers |
| `/admin/daily-logs` | Review all daily logs |
| `/admin/tour-reports` | Review end-of-tour reports |
| `/admin/demo-evaluations`, `/demo-evaluations/new`, `/demo-evaluations/[id]/edit` | Demo evaluations |
| `/admin/finance` | Expense advances & expense approvals |
| `/admin/registration-fees`, `/registration-fees/new` | Registration fees |
| `/admin/travel`, `/travel/new` | Travel tickets |
| `/admin/kits` | Kit inventory & assignment |
| `/admin/id-cards`, `/id-cards/new`, `/id-cards/[id]` | ID cards |
| `/admin/local-hosts`, `/local-hosts/new` | Local host families |
| `/admin/institutions` | Institution/school inquiries |
| `/admin/gallery`, `/gallery/new`, `/gallery/[categoryId]/images/new` | Gallery categories & images |
| `/admin/media` | Media files |
| `/admin/blog`, `/blog/new` | Blog posts |
| `/admin/newsletter`, `/newsletter/new` | Newsletters |
| `/admin/certificates`, `/certificates/new`, `/certificates/[id]` | Certificates |
| `/admin/testimonials` | Testimonial moderation |
| `/admin/sponsors` | Sponsor inquiries |
| `/admin/careers` | Career inquiries |
| `/admin/alumni` | Alumni registrations |
| `/admin/profiles` | All volunteer profiles |
| `/admin/earc-staff` | Grant/revoke EARC staff role |
| `/admin/super-admin` | Assign/change any user's role (`super_admin` only) |

### EARC Panel (`(earc)/earc`)

Not linked anywhere on the public website. Only accessible to `earc_staff`, `admin`, `super_admin`.

| Path | Description |
|---|---|
| `/earc` | EARC dashboard |
| `/earc/student-data` | Upload/manage student data files |
| `/earc/programme-data` | Upload/manage programme data files |
| `/earc/documents` | Upload/manage general documents |

### Dashboard router

`/dashboard` reads the caller's role and redirects to the correct portal (`/enrollee`, `/volunteer`, `/admin`, `/earc`).

---

## Database Schema

All tables are in the `public` schema. Full schema: `lib/supabase/schema.sql`.

### Core Tables

#### `users`
Synced from Clerk. Role controls access throughout the app.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `clerk_id` | text unique | Clerk user ID |
| `email` | text unique | |
| `name` | text | |
| `role` | text | `enrollee`, `volunteer`, `admin`, `super_admin`, `earc_staff`, or null |
| `avatar_url` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | auto-updated via trigger |

#### `tours`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title`, `description`, `destination` | text | |
| `start_date`, `end_date` | date | |
| `capacity` | integer | |
| `status` | text | `draft`, `open`, `closed`, `completed` |
| `eligibility_test_id` | uuid FK → eligibility_tests | optional |
| `created_by` | uuid FK → users | |

#### `eligibility_tests`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tour_id` | uuid FK → tours | |
| `duration_minutes` | integer | |
| `passing_score` | integer | 0–100 |
| `questions` | jsonb | array of `TestQuestion` objects |
| `status` | text | `draft`, `active`, `closed` |

#### `tour_applications`

| Column | Type | Notes |
|---|---|---|
| `tour_id` | uuid FK → tours | |
| `student_id` | uuid FK → users | |
| `status` | text | `pending`, `shortlisted`, `selected`, `rejected` |
| `test_score` | numeric | |

#### `test_attempts`

| Column | Type | Notes |
|---|---|---|
| `test_id` | uuid FK → eligibility_tests | |
| `student_id` | uuid FK → users | |
| `answers` | jsonb | `{ questionId: answer }` |
| `score` | numeric | |
| `status` | text | `in_progress`, `submitted`, `evaluated`, `pending_approval`, `approved`, `rejected` |

#### `dynamic_forms`

| Column | Type | Notes |
|---|---|---|
| `fields` | jsonb | array of `FormField` objects |
| `target_role` | text | `enrollee`, `volunteer`, `admin`, `all` |
| `status` | text | `draft`, `active`, `closed` |

#### `form_submissions`

| Column | Type | Notes |
|---|---|---|
| `form_id` | uuid FK → dynamic_forms | |
| `submitted_by` | uuid FK → users | |
| `data` | jsonb | field values |

#### `earc_files`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | original filename |
| `file_url` | text | Supabase Storage public URL |
| `file_type` | text | MIME type |
| `category` | text | `student_data`, `programme_data`, `document` |
| `description` | text | optional |
| `uploaded_by` | uuid FK → users | |
| `created_at` | timestamptz | |

### Other Tables

| Table | Purpose |
|---|---|
| `volunteer_profiles` | Extended volunteer info (phone, skills, emergency contact, Aadhaar verification…) |
| `volunteer_assignments` | volunteer ↔ tour assignments |
| `tour_groups` / `tour_group_members` | Groups within a tour / membership |
| `events` / `event_attendees` | Kattas, workshops, training events / RSVP + attendance |
| `workshops` / `workshop_groups` / `workshop_attendees` | Standalone workshop scheduling, group assignment, and attendance (incl. missed-workshop makeup flow) |
| `daily_logs` | Volunteer daily activity logs |
| `school_reports` | Per-group school visit reports |
| `tour_reports` | End-of-tour summary reports |
| `demo_evaluations` | Pre-tour demo evaluations assigned to volunteers |
| `media_gallery` | Tour media files |
| `certificates` | Issued certificates |
| `id_cards` | Issued volunteer ID cards |
| `registration_fees` | Registration fee records/status per volunteer |
| `expense_advances` / `expenses` | Advance requests and expense claims (submit → approve/reject/send back → resubmit) |
| `travel_tickets` / `location_updates` | Travel bookings and live location updates per group |
| `kit_items` / `kit_assignments` | Tour kit inventory and per-group distribution |
| `local_hosts` | Local host family records per group |
| `notifications` | Per-user notification feed |
| `visits` | Past site visits (public-facing) |
| `gallery_categories` + `gallery_images` | Public photo gallery |
| `blog_posts` | Blog content |
| `newsletters` | Newsletter issues |
| `testimonials` | Public testimonials (moderated) |
| `sponsor_inquiries` | Sponsor contact form submissions |
| `career_inquiries` | Career contact form submissions |
| `institution_inquiries` | Institution/school partnership inquiries |
| `alumni_profiles` / `alumni_registrations` | Alumni extended info / registration submissions |
| `logistics` | Tour logistics (travel, accommodation, kit) |

---

## Server Actions

All actions in `actions/`. All mutating actions validate input, check authorization, and use the Supabase server client (service role).

| File | Key Exports |
|---|---|
| `tours.ts` | `createTour`, `updateTour`, `deleteTour`, `applyForTour`, `updateApplicationStatus` |
| `tests.ts` | `createTest`, `updateTest`, `deleteTest`, `updateTestStatus`, `submitTestAttempt`, `saveSubjectiveEvaluation`, `editTestResult`, `approveTestResult`, `demoteVolunteer`, `rejectTestResult` |
| `forms.ts` | `createForm`, `updateForm`, `deleteForm`, `submitForm` |
| `groups.ts` | `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember`, `getAllGroups`, `getGroupsForSelect`, `getGroupsByTour`, `getMyGroup` |
| `events.ts` | `createEvent`, `updateEvent`, `deleteEvent`, `getEvents`, `rsvpEvent`, `getMyEventRsvps`, `markAttended` |
| `workshops.ts` | `createWorkshop`, `updateWorkshop`, `deleteWorkshop`, `getAllWorkshops`, `getUpcomingWorkshops`, `setWorkshopAttendance`, `getWorkshopAttendees`, `reportWorkshopAttended`, `submitMissedWorkshopSummary`, `decideMakeup`, `getMyWorkshopAttendance` |
| `daily-logs.ts` | `createDailyLog`, `updateDailyLog`, `deleteDailyLog`, `getMyDailyLogs`, `getAllDailyLogs`, `getMediaByTour`, `getTodayUploadCount`, `uploadMedia`, `deleteMedia` |
| `school-reports.ts` | `submitSchoolReport`, `updateSchoolReport`, `getGroupSchoolReports`, `getGroupMembersForSchoolReport` |
| `tour-reports.ts` | `submitTourReport`, `updateTourReport`, `approveTourReport`, `getAllTourReports`, `getMyTourReports` |
| `demo-evaluations.ts` | `createDemoEvaluation`, `updateDemoEvaluation`, `getAllDemoEvaluations`, `getMyDemoEvaluations`, `getDemoEvaluationById` |
| `finance.ts` | `createExpenseAdvance`, `getAllExpenseAdvances`, `submitExpense`, `approveExpense`, `rejectExpense`, `sendBackExpense`, `resubmitExpense`, `getAllExpenses`, `getMyExpenses` |
| `travel.ts` | `createTravelTicket`, `updateTravelTicket`, `deleteTravelTicket`, `getAllTravelTickets`, `getTravelTicketForMyGroup`, `postLocationUpdate`, `getLocationUpdatesForGroup` |
| `registration-fees.ts` | `createRegistrationFee`, `updateRegistrationFee`, `getAllRegistrationFees`, `getMyRegistrationFee` |
| `kits.ts` | `createKitItem`, `deleteKitItem`, `getAllKitItems`, `upsertKitAssignment`, `markKitDistributed`, `getAllKitAssignments`, `getKitAssignmentForMyGroup` |
| `local-hosts.ts` | `createLocalHost`, `updateLocalHost`, `deleteLocalHost`, `getAllLocalHosts`, `getLocalHostForMyGroup` |
| `id-cards.ts` | `createIdCard`, `deleteIdCard`, `getAllIdCards`, `getIdCard`, `getLatestIdCardForVolunteer`, `getMyIdCard` |
| `certificates.ts` | `issueCertificate`, `revokeCertificate`, `getAllCertificates`, `getMyCertificates`, `getCertificate`, `getMyCertificate` |
| `profiles.ts` | `upsertVolunteerProfile`, `getMyVolunteerProfile`, `getVolunteerProfileById`, `getAllVolunteerProfiles`, `setAadhaarVerified` |
| `users.ts` | `getAllUsers`, `updateUserRole`, `getEarcCandidates`, `setEarcStaffRole`, `deleteUser` |
| `earc.ts` | `uploadEarcFile`, `deleteEarcFile` |
| `upload.ts` | `uploadFileToStorage` (blog covers, gallery, newsletter) |
| `gallery.ts` | `createCategory`, `deleteCategory`, `addImage`, `deleteImage` |
| `visits.ts` | `createVisit`, `updateVisitStatus`, `deleteVisit` |
| `blog.ts` | `createPost`, `publishPost`, `deletePost` |
| `newsletter.ts` | `createNewsletter`, `publishNewsletter`, `deleteNewsletter` |
| `notifications.ts` | `createNotification`, `markNotificationRead`, `sendEmail` |
| `public-forms.ts` | `submitTestimonial`, `submitSponsorInquiry`, `submitCareerInquiry`, `submitInstitutionInquiry`, `approveTestimonial`, `declineTestimonial`, `deleteTestimonial` |
| `alumni-registration.ts` | `submitAlumniRegistration`, `getAllAlumniRegistrations` |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/webhooks/clerk` | POST | Clerk user sync (create/update/delete → Supabase) |
| `/api/tours` | GET | List tours (public, cached) |
| `/api/tours/[id]` | GET | Tour detail |
| `/api/volunteers` | GET | Volunteer list (admin) |
| `/api/groups/[groupId]` | GET | Group detail |
| `/api/notifications` | GET | Notification feed |

---

## Feature Modules

### Eligibility Test System

1. Admin creates test linked to a tour with MCQ, multi-select, or subjective questions
2. Enrollee applies for tour → takes timed test
3. Objective questions auto-evaluated on submit → score stored
4. Subjective questions require admin review (`saveSubjectiveEvaluation`)
5. Admin approves result (`approveTestResult`) → enrollee promoted to `volunteer` role
6. All active sessions revoked → user must re-login with new role
7. Admin can later demote (`demoteVolunteer`) back to `enrollee`, or edit a scored result (`editTestResult`)

### Dynamic Form Builder

Forms stored as JSON schema with typed fields:

```json
{
  "title": "Daily Report",
  "fields": [
    { "id": "activity", "type": "textarea", "label": "Activities", "required": true },
    { "id": "photos", "type": "file", "label": "Photos" }
  ]
}
```

Supported field types: `text`, `textarea`, `number`, `select`, `checkbox`, `radio`, `date`, `file`, `image`.

Forms have `target_role` (`enrollee`, `volunteer`, `admin`, `all`) — shown only to the matching role.

### Volunteer Logistics

Once promoted, volunteers pass through several tour-support flows, each with its own action file and admin review screen: daily logs, school reports, expenses/advances, travel tickets + location updates, registration fees, kit assignment, local host assignment, ID cards, and certificates.

### EARC Panel

Internal panel not linked from the public website. Accessible only to `earc_staff` and admins.

- Admin grants/revokes the `earc_staff` role on an existing user at `/admin/earc-staff` (`setEarcStaffRole`) — there is no separate account-creation flow; the target must already have a Clerk account
- Role changes revoke the user's active sessions, forcing re-login with the updated role
- EARC staff log in at `/sign-in` with their existing credentials
- Panel provides file upload in three categories: Student Data, Programme Data, Documents
- Files stored in the `earc-files` Supabase Storage bucket; metadata in the `earc_files` table
- Admin can remove staff access entirely (`deleteUser`, `super_admin` only)

---

## Storage Buckets

| Bucket | Public | Used For |
|---|---|---|
| `media` | yes | General media (legacy) |
| `blog-covers` | yes | Blog post cover images |
| `gallery-images` | yes | Public gallery photos |
| `newsletter-files` | yes | Newsletter PDFs |
| `earc-files` | yes | EARC staff uploads (student data, programme data, documents) |
| `documents` | yes | Bills, tickets, ID card photos, reports |

Bucket creation SQL is included in `schema.sql`.

---

## Caching Strategy

Upstash Redis used for:

- Dashboard statistics
- Active tours list
- Active forms list
- Rankings/leaderboards
- Global per-IP rate limiting in `middleware.ts` (200 req/min)

Rate limiting also applied to test submissions via `@upstash/ratelimit`.

ISR (Incremental Static Regeneration) used on public-facing pages where appropriate.

---

## Email

Resend used for transactional email (application status updates, notifications). Sender address configured via `RESEND_FROM_EMAIL`.

---

## Deployment

Deploy to Vercel. Set all environment variables from the `.env.local` template in the Vercel dashboard.

Clerk webhook: set the webhook URL in Clerk dashboard to `https://your-domain.com/api/webhooks/clerk`. Subscribe to `user.created`, `user.updated`, `user.deleted` events.

---

## DB Maintenance

### Fresh Setup

1. Run `lib/supabase/schema.sql` in Supabase SQL editor

### Full Reset (destroys all data)

1. Run `lib/supabase/reset.sql`
2. Run `lib/supabase/schema.sql`

### Upgrading an existing database

`schema.sql` is idempotent — tables use `create table if not exists`, and every schema change since is appended as its own `-- MIGRATION: ...` block using `alter table ... drop constraint if exists` / `add constraint`. Re-running the whole file against an already-provisioned DB is safe and applies every pending migration (role enum changes, workshop/RSVP status options, daily log question fields, travel ticket fields, expense categories, tour report rebuild) in one pass.
