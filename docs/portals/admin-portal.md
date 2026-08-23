# Admin Portal — How It Works

Role: `admin` / `super_admin`. Entry: `/admin` (redirected from `/dashboard`).

## Step-by-step flow

1. **Login** — Clerk auth, role resolved from `publicMetadata.role` (Supabase `users` fallback).
2. **Executive Dashboard** (`/admin`) — snapshot of active tours, pending approvals, cached stats (Redis `dashboardStats`).
3. **Tour Lifecycle** (`/admin/tours`) — create/edit/end/reactivate tours, set eligibility test, capacity, dates.
4. **Group Formation** (`/admin/groups`) — build tour groups, assign mentor/state, add/remove volunteer members.
5. **Applicant Pipeline**:
   - `/admin/students` — review enrollee applicant directory.
   - `/admin/tests` — build eligibility tests, grade subjective answers, approve results → auto-promotes enrollee to volunteer (triggers session revocation).
   - `/admin/forms` — build dynamic JSON forms, review submissions.
6. **Volunteer Oversight**:
   - `/admin/volunteers`, `/admin/profiles` — directory & full profile review.
   - `/admin/demo-evaluations` — score pre-tour demo performance.
   - `/admin/super-admin` (super_admin only) — change/demote user roles.
7. **Field Operations Monitoring**:
   - `/admin/daily-logs` — review daily logs from volunteers.
   - `/admin/school-reports` — browse/dashboard school visit reports.
   - `/admin/tour-reports` — approve end-of-tour reports.
   - `/admin/workshops`, `/admin/events` — schedule workshops/kattas, decide makeup sessions.
   - `/admin/locations` — live group location map.
8. **Logistics & Finance**:
   - `/admin/finance` — approve/reject expense advances & claims.
   - `/admin/registration-fees` — track/waive fees.
   - `/admin/travel` — book/track travel tickets.
   - `/admin/kits` — inventory & group distribution.
   - `/admin/local-hosts` — host family directory.
9. **Credentials** — `/admin/certificates`, `/admin/id-cards` — issue/revoke.
10. **Public Content** — `/admin/blog`, `/newsletter`, `/gallery`, `/visits`, `/media` — manage marketing content.
11. **Inquiries** — `/admin/testimonials`, `/sponsors`, `/institutions`, `/alumni` — moderate/approve.
12. **Analytics** (`/admin/analytics`) — system-wide metrics.

Every mutation runs through `requireAdminUser()`/`requireSuperAdminUser()` guard + Zod validation + `revalidatePath()`.
