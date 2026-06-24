# Gyan Setu

A full-stack platform for managing student exchange tours organized by educational institutes. Students apply for tours, take eligibility tests online, and selected students get access to volunteer resources and reporting tools.

Replaces Google Forms and manual workflows with a centralized, role-based system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Cache | Upstash Redis |
| Validation | Zod + React Hook Form |
| State | TanStack Query |
| Email | Resend |
| Deployment | Vercel |

---

## User Roles

| Role | Access |
|---|---|
| `enrollment_user` | Public portal, tour applications, eligibility tests |
| `volunteer` | Volunteer panel — tours, forms, daily logs, groups, media |
| `admin` / `super_admin` | Full admin console + EARC panel |
| `earc_staff` | EARC panel only — file uploads, student/programme data |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Clerk application
- Upstash Redis instance
- Resend account (for emails)

### Environment Variables

Create `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend
RESEND_API_KEY=
```

### Setup

```bash
npm install
```

Run the schema in Supabase SQL editor:

```
lib/supabase/schema.sql
```

Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To reset the database, run `lib/supabase/reset.sql` then re-run `schema.sql`.

---

## Project Structure

```
app/
  (admin)/admin/        # Admin console (admin + super_admin)
  (earc)/earc/          # EARC panel (earc_staff + admin)
  (student)/student/    # Student portal (enrollment_user)
  (volunteer)/volunteer/ # Volunteer panel (volunteer + admin)
  (auth)/               # Clerk sign-in / sign-up
  api/                  # Route handlers + webhooks
  blog/ gallery/ faq/   # Public-facing pages

actions/                # Next.js Server Actions
components/
  ui/                   # shadcn/ui primitives
  features/             # Feature components (tours, forms, tests, earc…)
  layout/               # Sidebar, providers
lib/
  clerk/                # Auth helpers, role checks, session revocation
  supabase/             # Client, server client, schema, reset
  redis/                # Upstash client
  validations/          # Zod schemas
types/                  # Shared TypeScript types
middleware.ts           # Clerk RBAC route protection
```

---

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for full architecture, feature details, and DB schema reference.
