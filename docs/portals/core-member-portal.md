# Core Member Portal — How It Works

Role: `group_core_member` (a volunteer promoted per-group by an admin, `setGroupCoreMember`). Entry: `/core-member` → redirects to `/core-member/dashboard`.

## Step-by-step flow

1. **Login** — promoted volunteer lands on `/core-member`, auto-redirected to `/core-member/dashboard`.
2. **Group Overview** (`/core-member/dashboard`) — see current tour/group and its volunteer roster, plus history of past group assignments (`getMyCoreMemberAssignments`).
3. **Volunteer Detail** (`/core-member/volunteer/[volunteerId]`) — open a single group member's profile — scoped strictly to own group via `assertCoreMemberOverVolunteer`.
4. **Score Demo Evaluations** — create/update demo evaluation scores for that volunteer (`createDemoEvaluationForVolunteer`, `updateDemoEvaluationForVolunteer`).
5. **Scope Limit** — cannot view or act on volunteers outside their own assigned group; no access to admin-only data (finance, other groups, role management).

Guard: `requireCoreMemberUser()`, all data access group-scoped.
