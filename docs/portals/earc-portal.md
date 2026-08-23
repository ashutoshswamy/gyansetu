# EARC Portal — How It Works

Role: `earc_staff` (granted by admin/super_admin). Entry: `/earc`.

## Step-by-step flow

1. **Login** — access requires `earc_staff` role, granted via `/earc/roles` by an admin.
2. **Field Portal Dashboard** (`/earc`) — landing view for field staff.
3. **School Profile Capture** (`/earc/school-profile`) — submit school-level data: academic year, project, location hierarchy (state/district/taluka/village), school type, module, mode, student strength (boys/girls per grade), sessions, duration. Server auto-computes `total_students` and `total_input_hours`.
4. **Student Profile Capture** (`/earc/student-profile`) — register individual student records: demographics, contact number, APAAR ID, Aadhaar.
5. **Review Analytics** (`/earc/dashboard`) — visual dashboard aggregating all submitted school & student data.
6. **Role Management** (`/earc/roles`, admin/super_admin only) — grant or revoke EARC staff access for a user.
7. **Data Export** — admin can run `exportSchoolProfilesCsv()` / `exportStudentProfilesCsv()` for RFC-4180 CSV downloads of all field data.

All writes go through `requireEarcUser()` guard.
