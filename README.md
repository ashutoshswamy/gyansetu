# Gyan Setu

**Gyan Setu** is a full-stack web application designed to manage student exchange tours, educational visits, volunteer workflows, and field data collection organized by educational institutes. It replaces fragmented Google Forms, physical paperwork, and manual spreadsheets with an integrated, role-based, real-time management system.

---

## Key Features & Highlights

- **Multi-Role Portal Access**: Role-based access control (RBAC) supporting 5 distinct user roles (`enrollee`, `volunteer`, `admin`, `super_admin`, and `earc_staff`).
- **Enrollee Application & Automated Testing**: Online tour browsing, application submission, and automated/manual online eligibility test evaluation pipeline.
- **Session Revocation Security**: Instant session revocation across active devices upon role promotion (e.g., enrollee $\rightarrow$ volunteer) or demotion.
- **Volunteer Operations Hub**:
  - Daily log submissions (minimum word count validation).
  - School visit reporting and end-of-tour comprehensive reports.
  - Workshop scheduling, attendance tracking, and missed workshop summary/makeup workflow.
  - Pre-tour demo evaluation scoring.
- **Logistics & Field Management**:
  - Group creation and mentor assignment.
  - Travel tickets, PNR tracking, and live location updates (Leaflet map integration).
  - Tour kit item inventory and group distribution tracking.
  - Local host family assignment per group.
- **Financial Workflow**:
  - Registration fee tracking (pending, paid, waived, refunded).
  - Expense advance requests.
  - Itemized expense claims with receipt uploads and multi-stage admin review (approve, reject with reason, or send back for revision).
- **EARC Field Operations**:
  - Structured School Profile forms with auto-calculated total input hours and student counts.
  - Student Profile data collection (APAAR ID, Aadhaar number, DOB, gender).
  - One-click admin CSV exports for reporting.
- **Credential Generation**: Dynamic PDF/Image export for official Volunteer ID Cards and Certificates of Completion (Participation, Excellence, Leadership, Mentor).
- **Public Portal & Engagement**: Dynamic Landing Page, Photo Gallery, Visits Showcase, Blog, Newsletters, FAQ, Testimonials, Sponsor Inquiries, Career Inquiries, Institution Partnerships, and Alumni Network Registration.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [TailwindCSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://motion.dev/), [Lucide Icons](https://lucide.dev/) |
| **Authentication** | [Clerk Auth](https://clerk.com/) (JWT session claims + webhook sync) |
| **Database & RLS** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| **Storage** | [Supabase Storage](https://supabase.com/docs/guides/storage) (Media, Documents, ID cards, Certificates) |
| **Caching & Rate Limiting** | [Upstash Redis](https://upstash.com/) (Sliding-window IP rate limiting & query caching) |
| **Validation & Forms** | [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/) |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query/latest) |
| **Email Service** | [Resend](https://resend.com/) |
| **Maps & Export** | [Leaflet](https://leafletjs.com/), [jsPDF](https://github.com/parallax/jsPDF), [html-to-image](https://github.com/bubkoo/html-to-image) |

---

## User Roles & Access Overview

| Role | Target Audience | Accessible Portals & Capabilities |
| --- | --- | --- |
| `enrollee` | Students / Applicants | Public pages, open tour discovery, tour applications, timed eligibility tests, dynamic applicant forms, personal profile. |
| `volunteer` | Qualified Volunteers | Volunteer Panel — assigned tours, group logistics, travel tickets, expense claims, daily logs, school reports, workshop attendance/makeups, ID card & certificates. |
| `admin` | Program Managers | Full Admin Console — tour creation, test grading & candidate approval, group assignment, finance approval, kit management, content moderation, analytics. |
| `super_admin` | System Directors | All Admin permissions + user role modification (`/admin/super-admin`), user deletion, system override. |
| `earc_staff` | EARC Field Staff | Dedicated EARC Panel — School Profile data collection, Student Profile registrations, field data management. |

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (comes with Node.js)
- **Third-Party Services**:
  - Supabase Project (Database & Storage)
  - Clerk Account (User Authentication)
  - Upstash Redis Instance (Rate Limiting)
  - Resend Account (Transactional Email)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Database & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Upstash Redis (Caching & Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Resend (Transactional Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Gyan Setu <noreply@yourdomain.com>
```

### Installation & Database Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Provision Database Schema**:
   Run the contents of [`lib/supabase/schema.sql`](./lib/supabase/schema.sql) inside the Supabase SQL Editor.
   *(Note: `schema.sql` is idempotent and safe to re-run on existing databases).*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## CLI & Maintenance Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Builds the production application bundle. |
| `npm run start` | Starts the built production server. |
| `npm run typecheck` | Runs TypeScript compiler validation without emitting files. |
| `npm run test` | Runs the Vitest test suite (`lib/scoring.test.ts`, `lib/clerk/action-auth.test.ts`, `lib/validations/index.test.ts`). |
| `npm run lint` | Runs ESLint checks across the codebase. |
| `npm run seed:volunteers` | Seeds mock volunteer users into the database. |
| `npm run seed:enrollees` | Seeds mock enrollee candidates into the database. |
| `npm run seed:tours` | Seeds mock tour records. |
| `npm run seed:groups` | Seeds mock tour groups. |
| `npm run unseed:volunteers` | Cleans up seeded volunteer records. |
| `npm run unseed:enrollees` | Cleans up seeded enrollee records. |
| `npm run unseed:tours` | Cleans up seeded tour records. |
| `npm run unseed:groups` | Cleans up seeded group records. |
| `npm run delete:clerk-users` | Utility script to clear development users from Clerk. |

---

## Project Structure Overview

```
gyan-setu/
├── actions/                  # 29 Next.js Server Actions (Auth-guarded mutations & queries)
├── app/                      # Next.js App Router Structure
│   ├── (admin)/admin/        # Admin Console (admin & super_admin)
│   ├── (auth)/               # Clerk Authentication pages (/sign-in, /sign-up)
│   ├── (earc)/earc/          # EARC Field Data Panel (earc_staff, admin, super_admin)
│   ├── (enrollee)/enrollee/  # Enrollee Student Portal
│   ├── (public)/             # Public Landing Page & Marketing Content (blog, gallery, etc.)
│   ├── (volunteer)/volunteer/# Volunteer Portal & Operational Workflows
│   ├── api/                  # API Route Handlers & Webhooks (/api/webhooks/clerk, etc.)
│   └── dashboard/            # Post-login role router
├── components/
│   ├── features/             # Business Domain Components (tours, forms, earc, tests, etc.)
│   ├── layout/               # Header, Sidebar, Navigation, and Shell providers
│   └── ui/                   # Primitive UI components (shadcn/ui base)
├── lib/
│   ├── clerk/                # Clerk helpers, action authorization, session revocation
│   ├── redis/                # Upstash Redis client configuration
│   ├── supabase/             # Supabase clients, schema.sql, migrations, reset.sql
│   └── validations/          # Zod validation schemas for all domain entities
├── scripts/                  # Database seeding and cleanup utilities
├── types/                    # Shared TypeScript interfaces and type declarations
└── middleware.ts             # Global rate limiting & Clerk RBAC route matcher
```

---

## Documentation & References

- Technical Architectural Reference: [`DOCUMENTATION.md`](./DOCUMENTATION.md)
- Security Specification & Threat Model: [`SECURITY.md`](./SECURITY.md)
