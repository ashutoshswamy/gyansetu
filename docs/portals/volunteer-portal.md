# Volunteer Portal — How It Works

Role: `volunteer` (promoted from `enrollee` after passing eligibility test). Entry: `/volunteer`.

## Step-by-step flow

1. **Login** — promoted account lands on `/volunteer` dashboard.
2. **Group Assignment** (`/volunteer/groups`) — view assigned tour group, mentor, state, and teammates (set by admin).
3. **Pre-Tour Prep**:
   - `/volunteer/forms` — complete volunteer-targeted forms.
   - `/volunteer/workshops` — attend scheduled training workshops; if missed, submit summary for makeup review.
   - `/volunteer/demo-evaluations` — undergo demo evaluation scoring before deployment.
   - `/volunteer/events` — RSVP to kattas/melawas/training events, mark attendance.
4. **Registration & Travel**:
   - `/volunteer/registration-fee` — check/pay personal fee status.
   - `/volunteer/travel` — view PNR/travel tickets; post live location updates.
   - `/volunteer/id-card` — generate official volunteer ID card.
5. **On-Tour Field Work** (`/volunteer/tours` — assigned tour):
   - `/volunteer/location` — share live location during active tour.
   - `/volunteer/daily-log` — submit daily log (word-count validated: activities, achievements, challenges, learning, impact).
   - `/volunteer/school-reports` — submit detailed school visit reports.
   - `/volunteer/media` — upload tour photos/media.
   - `/volunteer/expenses` — request advances, submit itemized expense claims for approval.
6. **End of Tour** — submit `/volunteer/tour-report` (comprehensive end-of-tour report) for admin approval.
7. **Post-Tour**:
   - `/volunteer/certificates` — view/download earned certificates as PDF.
   - `/volunteer/profile` — maintain profile & Aadhaar verification status.
   - When a tour ends, unassigned volunteers may be auto-demoted back to `enrollee` (tracked in `tour_end_demotions`) until reactivated.

All submissions route through `requireVolunteerUser()` guard; group-scoped data is restricted via `assertGroupAccess`.
