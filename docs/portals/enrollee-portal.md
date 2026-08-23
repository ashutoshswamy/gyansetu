# Enrollee Portal — How It Works

Role: `enrollee` (default role on sign-up). Entry: `/enrollee`.

## Step-by-step flow

1. **Register / Login** — sign up via Clerk, land on `/enrollee` dashboard as default role.
2. **Browse Open Tours** (`/enrollee/tours`) — view open tours; drill into `/enrollee/tours/[id]` for details.
3. **Apply for a Tour** — `applyForTour` action files a `tour_applications` row (status `pending`).
4. **Fill Assigned Forms** (`/enrollee/forms`) — complete any dynamic forms targeted at enrollees; submit via `/enrollee/forms/[id]`.
5. **Take Eligibility Test** (`/enrollee/tests`) — timed test tied to the applied tour; open `/enrollee/tests/[id]`, answer, submit (`submitTestAttempt`, rate-limited).
6. **Await Grading** — admin grades subjective answers and approves result (`approveTestResult`). Passing auto-promotes the account to `volunteer` and forces a session refresh.
7. **Track History** (`/enrollee/history`) — view past tour applications; `/enrollee/history/[tourId]` for per-tour detail.
8. **Maintain Profile** (`/enrollee/profile`) — keep personal details current before/after applying.

Once promoted to `volunteer`, the account gains access to the Volunteer Portal and loses enrollee-only routes.
