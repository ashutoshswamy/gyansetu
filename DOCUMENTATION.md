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

Next.js 15 App Router with server components by default. Data fetching happens in server components via Supabase server client. Mutations go through Server Actions. Client components are used only for interactivity (forms, uploads, real-time UI).

```
Browser → Clerk Auth → Next.js Middleware (RBAC) → App Router
                                                      ├─ Server Components → Supabase (direct)
                                                      ├─ Server Actions → Supabase + Clerk API
                                                      └─ API Routes → Supabase / Clerk webhooks
```

---

## Authentication & RBAC

### Clerk

All auth is handled by Clerk. Roles are stored in `publicMetadata.role` on the Clerk user object and synced to the `users` table in Supabase.

Role is read from the Clerk JWT `sessionClaims.metadata.role` in middleware and layout files. If Clerk JWT has no role, layouts fall back to querying Supabase and then sync back to Clerk.

### Middleware (`middleware.ts`)

Route matchers enforce role access:

| Route pattern | Allowed roles |
|---|---|
| `/admin(.*)` | `admin`, `super_admin` |
| `/volunteer(.*)` | `volunteer`, `admin`, `super_admin` |
| `/student(.*)` | any authenticated user except `admin`, `super_admin` |
| `/earc(.*)` | `earc_staff`, `admin`, `super_admin` |
| Public routes | unauthenticated allowed |

### Role Helpers (`lib/clerk/`)

| File | Exports |
|---|---|
| `roles.ts` | `getUserRole()`, `requireRole()`, `isAdmin()`, `getAuthUser()` |
| `action-auth.ts` | `requireAdminUser()`, `requireVolunteerUser()`, `requireEarcUser()`, `getAuthenticatedUser()` |
| `revoke-sessions.ts` | `revokeAllUserSessions(clerkUserId)` |

### Session Revocation

When a user's role is promoted or demoted, all their active Clerk sessions are revoked immediately via `revokeAllUserSessions()`. This forces re-login so the new role appears in the JWT. Applied in:

- `actions/tests.ts` — `approveTestResult` (enrollment_user → volunteer)
- `actions/earc.ts` — `createEarcStaff` when promoting an existing user

### Supabase Sync

The Clerk webhook (`/api/webhooks/clerk`) syncs user creation/updates to the `users` table. Layout files also perform an upsert on every render as a fallback.

---

## Route Structure

### Public Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/gallery` | Photo gallery |
| `/visits` | Past visits |
| `/faq` | FAQ |
| `/testimonial` | Testimonials |
| `/newsletter` | Newsletter archive |
| `/sponsor` | Sponsor inquiry |
| `/careers` | Career inquiry |

### Auth Routes

| Path | Description |
|---|---|
| `/sign-in` | Clerk sign-in (hosted UI) |
| `/sign-up` | Clerk sign-up (hosted UI) |

### Student Portal (`/student`)

| Path | Description |
|---|---|
| `/student` | Dashboard |
| `/student/tours` | Browse open tours |
| `/student/tours/[id]` | Tour detail + apply |
| `/student/tests` | My eligibility tests |
| `/student/tests/[id]` | Take test |
| `/student/forms` | My forms |
| `/student/forms/[id]` | Fill dynamic form |

### Volunteer Panel (`/volunteer`)

| Path | Description |
|---|---|
| `/volunteer` | Dashboard |
| `/volunteer/tours` | My tours |
| `/volunteer/forms` | Tasks & forms |
| `/volunteer/forms/[id]` | Fill form |
| `/volunteer/events` | Events |
| `/volunteer/groups` | My group |
| `/volunteer/daily-log` | Daily log entries |
| `/volunteer/media` | Upload media |
| `/volunteer/certificates` | My certificates |
| `/volunteer/profile` | Volunteer profile |

### Admin Console (`/admin`)

| Path | Description |
|---|---|
| `/admin` | Dashboard |
| `/admin/analytics` | Analytics |
| `/admin/tours` | Manage tours |
| `/admin/tours/new` | Create tour |
| `/admin/tours/[id]` | Tour detail |
| `/admin/visits` | Manage visits |
| `/admin/groups` | Tour groups |
| `/admin/groups/new` | Create group |
| `/admin/groups/[groupId]` | Group detail |
| `/admin/events` | Events |
| `/admin/events/new` | Create event |
| `/admin/tests` | Eligibility tests + approve results |
| `/admin/tests/new` | Create test |
| `/admin/forms` | Dynamic forms |
| `/admin/forms/new` | Create form |
| `/admin/forms/templates` | Form templates |
| `/admin/students` | Enrolled users |
| `/admin/volunteers` | Volunteers |
| `/admin/volunteers/[id]` | Volunteer detail |
| `/admin/gallery` | Gallery categories |
| `/admin/gallery/new` | New category |
| `/admin/gallery/[categoryId]/images/new` | Upload images |
| `/admin/media` | Media files |
| `/admin/blog` | Blog posts |
| `/admin/blog/new` | New post |
| `/admin/newsletter` | Newsletters |
| `/admin/newsletter/new` | New newsletter |
| `/admin/certificates` | Issue certificates |
| `/admin/certificates/new` | New certificate |
| `/admin/testimonials` | Testimonial moderation |
| `/admin/sponsors` | Sponsor inquiries |
| `/admin/careers` | Career inquiries |
| `/admin/earc-staff` | Create/manage EARC staff |

### EARC Panel (`/earc`)

Not linked anywhere on the public website. Only accessible to `earc_staff`, `admin`, `super_admin`.

| Path | Description |
|---|---|
| `/earc` | EARC dashboard |
| `/earc/student-data` | Upload/manage student data files |
| `/earc/programme-data` | Upload/manage programme data files |
| `/earc/documents` | Upload/manage general documents |

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
| `role` | text | `enrollment_user`, `volunteer`, `admin`, `super_admin`, `earc_staff`, or null |
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
| `target_role` | text | `enrollment_user`, `volunteer`, `all` |
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
| `volunteer_profiles` | Extended volunteer info (phone, skills, emergency contact…) |
| `volunteer_assignments` | volunteer ↔ tour assignments |
| `tour_groups` | Groups within a tour |
| `tour_group_members` | User ↔ group membership |
| `events` | Kattas, workshops, training events |
| `event_attendees` | RSVP/attendance per event |
| `daily_logs` | Volunteer daily activity logs |
| `media_gallery` | Tour media files |
| `certificates` | Issued certificates |
| `notifications` | Per-user notification feed |
| `visits` | Past site visits (public-facing) |
| `gallery_categories` + `gallery_images` | Public photo gallery |
| `blog_posts` | Blog content |
| `newsletters` | Newsletter issues |
| `testimonials` | Public testimonials (moderated) |
| `sponsor_inquiries` | Sponsor contact form submissions |
| `career_inquiries` | Career contact form submissions |
| `alumni_profiles` | Alumni extended info |
| `logistics` | Tour logistics (travel, accommodation, kit) |

---

## Server Actions

All actions in `actions/`. All mutating actions validate input, check authorization, and use the Supabase server client (service role).

| File | Key Exports |
|---|---|
| `tours.ts` | `createTour`, `updateTour`, `deleteTour`, `applyForTour` |
| `tests.ts` | `createTest`, `updateTest`, `submitTestAttempt`, `approveTestResult`, `rejectTestResult` |
| `forms.ts` | `createForm`, `updateForm`, `deleteForm`, `submitForm` |
| `groups.ts` | `createGroup`, `addGroupMember`, `removeGroupMember`, `getGroupWithMembers` |
| `events.ts` | `createEvent`, `updateEvent`, `deleteEvent`, `updateAttendance` |
| `daily-logs.ts` | `submitDailyLog`, `updateDailyLog` |
| `certificates.ts` | `issueCertificate`, `deleteCertificate` |
| `profiles.ts` | `getVolunteerProfile`, `upsertVolunteerProfile` |
| `upload.ts` | `uploadFileToStorage` (blog covers, gallery, newsletter) |
| `gallery.ts` | `createGalleryCategory`, `uploadGalleryImage`, `deleteGalleryImage` |
| `visits.ts` | `createVisit`, `updateVisit`, `deleteVisit` |
| `blog.ts` | `createPost`, `updatePost`, `deletePost` |
| `newsletter.ts` | `createNewsletter`, `updateNewsletter` |
| `notifications.ts` | `createNotification`, `markRead` |
| `public-forms.ts` | `submitTestimonial`, `submitSponsorInquiry`, `submitCareerInquiry` |
| `earc.ts` | `createEarcStaff`, `deleteEarcStaff`, `uploadEarcFile`, `deleteEarcFile` |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/webhooks/clerk` | POST | Clerk user sync (create/update/delete → Supabase) |
| `/api/tours` | GET | List tours (public, cached) |
| `/api/tours/[id]` | GET | Tour detail |
| `/api/volunteers` | GET | Volunteer list (admin) |
| `/api/groups/[groupId]` | GET/PATCH | Group operations |
| `/api/notifications` | GET/POST | Notification feed |

---

## Feature Modules

### Eligibility Test System

1. Admin creates test linked to a tour with MCQ, multi-select, or subjective questions
2. Student applies for tour → takes timed test
3. Objective questions auto-evaluated on submit → score stored
4. Subjective questions require admin review
5. Admin approves result → student promoted to `volunteer` role
6. All active sessions revoked → student must re-login with new role

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

Forms have `target_role` — shown only to the matching role.

### EARC Panel

Internal panel not linked from the public website. Accessible only to `earc_staff` and admins.

- Admin creates EARC staff at `/admin/earc-staff` using email + password via Clerk API
- If email already exists, the existing user is promoted to `earc_staff` and their sessions are revoked
- EARC staff log in at `/sign-in` with their credentials
- Panel provides file upload in three categories: Student Data, Programme Data, Documents
- Files stored in `earc-files` Supabase Storage bucket; metadata in `earc_files` table
- Admin can remove staff (deletes Clerk account + Supabase row)

---

## Storage Buckets

| Bucket | Public | Used For |
|---|---|---|
| `media` | yes | General media (legacy) |
| `blog-covers` | yes | Blog post cover images |
| `gallery-images` | yes | Public gallery photos |
| `newsletter-files` | yes | Newsletter PDFs |
| `earc-files` | yes | EARC staff uploads (student data, programme data, documents) |

Bucket creation SQL is included in `schema.sql`.

---

## Caching Strategy

Upstash Redis used for:

- Dashboard statistics
- Active tours list
- Active forms list
- Rankings/leaderboards

Rate limiting applied to test submissions via `@upstash/ratelimit`.

ISR (Incremental Static Regeneration) used on public-facing pages where appropriate.

---

## Email

Resend used for transactional email (application status updates, notifications).

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

### Apply earc_staff role to existing DB (without reset)

```sql
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('enrollment_user', 'volunteer', 'admin', 'super_admin', 'earc_staff'));
```

Then run the `earc_files` table + bucket section from the bottom of `schema.sql`.
