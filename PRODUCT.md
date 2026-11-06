# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: prospective volunteers (college students and young adults across India) deciding whether to apply to Gyan-Setu. Secondary: partner institutions, sponsors, alumni, and past volunteers submitting testimonials.

## Product Purpose
Gyan-Setu is a year-long volunteer initiative of Jnana Prabodhini's Educational Activity Research Centre (EARC), Pune (est. 2013). Volunteers run joyful hands-on science and mathematics workshops, career guidance sessions, and the "Know Our Country" Exhibition in remote, tribal, and aspirational regions across India, fostering scientific curiosity, knowledge exchange, cultural understanding, and national integration. The landing page's job is to get qualified volunteers to apply (sign-up), and to route institutions, sponsors, and alumni to their own pages. The app behind it replaces Google Forms and spreadsheets with role-based portals (enrollee, volunteer, core member, admin, EARC staff).

## Positioning
A year-long, field-based volunteer exchange run by an established educational institution (Jnana Prabodhini), where volunteers travel to schools in remote and tribal India: service plus learning plus national integration, not a one-off donation drive.

## Operating Context
Next.js 16 App Router site, Clerk auth, Supabase data. Landing page is a client component fed approved testimonials from the DB (revalidate 60s). Signed-in users see "Go to Home" (/dashboard) instead of apply.

## Capabilities and Constraints
Public routes that must keep working: /sign-up, /sign-in, /dashboard, /testimonial, /alumni, /institution, /sponsor, /visits, /gallery, /blog, /faq, /newsletter. Landing anchors to preserve: #our-story, #how-it-works, #testimonials, #alumni, #institutions. Section order stays. Existing stats are real and kept as-is: 91,348 students connected, 1,688 schools reached, 13 states and UT, 1,050 volunteers engaged.

## Brand Commitments
Keep Jnana Prabodhini / EARC branding and existing logos (public/logo.png, logo_wide.png, earc_logo.png). Tagline "ज्ञान सेतू, a bridge of knowledge". Existing copy facts stay; no invented claims.

## Evidence on Hand
~260 real field photographs in public/posts (1.png to 260.png). Approved testimonials from the testimonials table. The four stats above. Absent: no video, no press, no sponsor logos confirmed. Do not fabricate customers, benchmarks, or quotes.

## Product Principles
1. The real field photos are the proof; lead with them.
2. One clear action for the primary audience: apply as a volunteer.
3. Respect the institution and the communities served; warm and credible, never charity-poster or hype.
4. Keep it fast and accessible on mid-range phones in India.

## Accessibility & Inclusion
Bilingual touch (English plus Devanagari) must render correctly. WCAG AA contrast, reduced-motion respected, usable on low-end mobile and slow connections.
