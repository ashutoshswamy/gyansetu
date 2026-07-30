# Gyan Setu — Security Architecture & Policy

## 1. Security Architecture & Principles

Gyan Setu enforces a **defense-in-depth** security architecture to protect student data, volunteer records, and administrative controls. Security is applied across multiple independent layers:

```
┌────────────────────────────────────────────────────────┐
│ Layer 1: Edge & Network Rate Limiting (Upstash Redis) │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 2: Edge Middleware RBAC Guards (Clerk Auth)      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 3: Server Action Guards & Group Scope Isolation  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 4: Schema-Level Input Validation (Zod Schemas)   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Layer 5: Database Row Level Security (Supabase RLS)    │
└──────────────────────────┬─────────────────────────────┘
```

---

## 2. Authentication & Session Management

### 2.1 Managed Authentication (Clerk)

- User authentication is delegated to **Clerk Auth**, utilizing secure, cryptographically signed JSON Web Tokens (JWTs) and HTTP-only cookies.
- Authentication tokens are validated on every request by Next.js edge middleware.
- Role metadata (`publicMetadata.role`) is stored in Clerk user claims and verified against the session JWT.

### 2.2 Immediate Session Revocation on Role Mutation

To eliminate the risk of privilege escalation or unauthorized access via stale JWT claims, the application enforces **Instant Session Revocation**:

- When a user's role is promoted (e.g., an `enrollee` passes an eligibility test and is approved as a `volunteer`), or demoted by an admin, the system immediately invokes `revokeAllUserSessions(clerkUserId)` via the Clerk API ([`lib/clerk/revoke-sessions.ts`](./lib/clerk/revoke-sessions.ts)).
- This revokes all active session tokens across all devices, forcing the user's browser to perform an immediate re-authentication and fetch an updated JWT containing the newly assigned role.

### 2.3 Dual-Source Role Verification & Self-Healing

- [`lib/clerk/action-auth.ts`](./lib/clerk/action-auth.ts) implements a resilient fallback mechanism.
- If a user's JWT lacks a role claim, the system queries the Supabase `users` database table directly.
- If a user row is missing from Supabase (e.g., due to an interrupted webhook), the system automatically backfills the user record using Clerk profile details, ensuring zero unauthorized access or unhandled crashes.

---

## 3. Authorization & Access Control (RBAC)

### 3.1 Permission Matrix

| Role | Accessible Resources & Actions |
| --- | --- |
| `enrollee` | Public content, view open tours, apply for tours, take timed eligibility tests, fill enrollee dynamic forms. |
| `volunteer` | Volunteer portal, view assigned group details, submit daily logs, fill school reports, submit end-of-tour reports, claim expenses, submit missed workshop summaries, view travel tickets & location logs, generate ID card & certificates. |
| `group_core_member` | Everything a `volunteer` can do, plus (scoped to their own tour group only) view fellow group members' details and score their pre-tour demo evaluations. Promoted per-group by an `admin` via `setGroupCoreMember`. |
| `admin` | Admin console, manage tours & groups, grade subjective test questions, approve/demote volunteers, promote/demote `group_core_member` per group, grant/revoke `earc_staff` role, approve expense claims, schedule workshops/events, issue certificates & ID cards, moderate public content. |
| `super_admin` | All `admin` privileges + alter any user's role (`/admin/super-admin`), delete user accounts. |
| `earc_staff` | EARC field portal, submit EARC School Profiles & Student Profiles, export CSV field reports. |

### 3.2 Server Action Guards

All Next.js Server Actions validate caller credentials using mandatory guard functions:

```typescript
// Guard check required at entry of every server action
const { db, user } = await requireAdminUser();       // Requires admin or super_admin
const { db, user } = await requireVolunteerUser();   // Requires volunteer, admin, or super_admin
const { db, user } = await requireEarcUser();        // Requires earc_staff, admin, or super_admin
const { db, user } = await requireCoreMemberUser();  // Requires group_core_member, admin, or super_admin
const { db, user } = await requireSuperAdminUser();  // Requires super_admin
```

### 3.3 Strict Group Data Isolation

Volunteers are restricted to viewing and managing logistics (travel tickets, location logs, kit distribution, host families) **only for groups to which they are explicitly assigned**:

- Guarded via `assertGroupAccess(db, user, groupId)` in [`lib/clerk/action-auth.ts`](./lib/clerk/action-auth.ts).
- A `group_core_member` is further restricted to only view or score volunteers within their own group, guarded via `assertCoreMemberOverVolunteer(db, user, groupId, volunteerId)` in the same file.
- Admin and Super Admin roles bypass group isolation to enable system-wide management.

---

## 4. Network & Input Protection

### 4.1 Rate Limiting & Denial of Service Protection

- **Global IP Rate Limiting**: Enforced in [`proxy.ts`](./proxy.ts) using Upstash Redis sliding window algorithm set at **200 requests per minute per IP address**.
- **Test Submission Rate Limiting**: Per-user sliding window rate limiting prevents automated script submissions on eligibility tests.

### 4.2 Webhook Signature Verification

- Incoming webhooks from Clerk Auth (`/api/webhooks/clerk`) are verified using **Svix** (`svix` package).
- Webhooks missing valid `svix-id`, `svix-timestamp`, or `svix-signature` headers are rejected immediately with HTTP 400.

### 4.3 Input Validation & Type Safety

- All incoming request payloads in Server Actions are parsed and validated against strict **Zod schemas** ([`lib/validations/index.ts`](./lib/validations/index.ts)).
- Malformed, oversized, or extra fields are rejected at the application boundary prior to database operations.

### 4.4 SQL Injection & XSS Prevention

- All database queries are executed via the Supabase client library, using parameterized queries that eliminate SQL injection vectors.
- React's default JSX escaping ensures output sanitization against Cross-Site Scripting (XSS).

---

## 5. Row Level Security (RLS) & Data Privacy

### 5.1 Supabase RLS Policies

All database tables in Supabase have **Row Level Security (RLS)** enabled:

- RLS policies check `auth.uid()` against Clerk user IDs.
- Direct database calls from the client can only access rows matching authorized policy rules.
- Server Actions use the Supabase Service Role client securely on the server side after verifying authorization via `action-auth.ts`.

### 5.2 Protection of Sensitive Information (PII)

- Sensitive fields (Aadhaar numbers, APAAR IDs, medical emergency details, contact numbers) are accessible only to authorized roles (`admin`, `super_admin`, the assigned `group_core_member` for that group, or `earc_staff`).
- Document uploads (receipts, Aadhaar verifications, travel tickets) are stored in configured Supabase Storage buckets with role-checked access control.

---

## 6. Vulnerability Reporting & Security Disclosures

If you discover a potential security vulnerability within Gyan Setu, please report it responsibly:

1. **Do NOT** file a public GitHub issue for security vulnerabilities.
2. Email full details of the vulnerability, steps to reproduce, and impact analysis to the development security team.
3. The security team will acknowledge receipt within 24–48 hours and provide a timeline for patch deployment.
