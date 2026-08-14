# Deployment Setup Guide

Setup guide for services this project need. Do these before deploy to prod.

## 1. Supabase (Database)

1. Go [supabase.com](https://supabase.com), sign up, click "New Project".
2. Pick org, name project, set strong DB password (save it), pick region close to users, click "Create new project".
3. Wait ~2 min for provision.
4. Run existing migrations/schema against this project (check `supabase/` folder in repo if present, or ask prior dev for schema SQL / migration files).
5. Go to **Project Settings → API**. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret, server-side only, never expose to client)
6. If Row Level Security (RLS) policies used, verify enabled on all tables (**Table Editor → table → RLS**).

## 2. Upstash Redis (Rate limiting / caching)

1. Go [upstash.com](https://upstash.com), sign up.
2. Click "Create Database". Choose Redis, name it, pick region (close to Supabase region/deploy region for low latency), select "Global" or "Regional" per need.
3. Once created, open database, go to **REST API** section.
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Used here via `@upstash/redis` + `@upstash/ratelimit` packages — no extra setup needed beyond env vars.

## 3. Clerk (Auth)

1. Go [clerk.com](https://clerk.com), sign up, "Create application".
2. Name app, pick sign-in methods (email, Google, etc).
3. Go to **API Keys**. Copy:
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`
4. Set these URLs (match app routes, defaults usually fine):
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard` (or wherever)
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/dashboard` (or wherever)
5. **Webhooks** (needed — app syncs Clerk user events, e.g. to Supabase):
   - Go **Webhooks** in Clerk dashboard → "Add Endpoint".
   - Endpoint URL: `https://<your-prod-domain>/api/webhooks/clerk` (check actual route in `app/api/webhooks/` folder).
   - Subscribe to events used (likely `user.created`, `user.updated`, `user.deleted`).
   - Copy "Signing Secret" → `CLERK_WEBHOOK_SECRET`.
6. In Clerk dashboard, switch app from dev to prod instance when going live (Clerk has separate dev/prod API keys — use prod keys for prod deploy).

## 4. Resend (Transactional email)

1. Go [resend.com](https://resend.com), sign up.
2. **API Keys** → "Create API Key" → copy → `RESEND_API_KEY`.
3. **Domains** → "Add Domain", enter your prod domain (e.g. `gyansetu.com`).
4. Add DNS records Resend gives (SPF, DKIM, DMARC) at domain registrar/DNS host. Wait for verification (few min–hours).
5. Set `RESEND_FROM_EMAIL` to address on verified domain, e.g. `noreply@gyansetu.com`. Won't work with unverified domain in prod.

## 5. App URL

- `NEXT_PUBLIC_APP_URL` = full prod URL, e.g. `https://gyansetu.com` (no trailing slash). Used for callback URLs, emails, etc.

## Full env var list (`.env.local` in prod host, e.g. Vercel)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
```

## Deploy (Vercel, typical for Next.js)

1. Push repo to GitHub.
2. Import repo in [vercel.com](https://vercel.com).
3. Add all env vars above in **Project Settings → Environment Variables** (Production scope).
4. Deploy.
5. After first deploy, update Clerk webhook URL and Resend domain checks to point at actual prod URL if not already set.

## Security notes

- Never commit `.env.local` or real keys to git.
- `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` = server-only secrets, never prefix `NEXT_PUBLIC_`, never expose client-side.
- Rotate keys if accidentally leaked (each dashboard has regenerate option).
