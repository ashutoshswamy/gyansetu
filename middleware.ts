import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import type { UserRole } from "@/types";

// ponytail: global floor for everything not already covered by a tighter
// per-action limiter (actions/*.ts). Bump if legit dashboard usage trips it.
const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "1 m"),
});

const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/gallery(.*)",
  "/visits(.*)",
  "/blog(.*)",
  "/newsletter(.*)",
  "/faq(.*)",
  "/testimonial(.*)",
  "/sponsor(.*)",
  "/careers(.*)",
  "/institution(.*)",
  "/alumni(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isVolunteerRoute = createRouteMatcher(["/volunteer(.*)"]);
const isEnrolleeRoute = createRouteMatcher(["/enrollee(.*)"]);
const isEarcRoute = createRouteMatcher(["/earc(.*)"]);
const isCoreMemberRoute = createRouteMatcher(["/core-member(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isWebhookRoute(req)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await globalRatelimit.limit(`global:${ip}`);
    if (!success) {
      return new NextResponse("Too many requests. Please try again later.", { status: 429 });
    }
  }

  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const role = (sessionClaims?.metadata as { role?: UserRole })?.role;

  // Admin routes: only admin/super_admin pass. Null role bypasses here on purpose —
  // (admin)/layout.tsx re-verifies against Supabase for manually-promoted
  // admins whose Clerk JWT hasn't synced yet, and redirects otherwise.
  if (isAdminRoute(req) && role !== "admin" && role !== "super_admin") {
    if (role !== null && role !== undefined) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Volunteer routes: only volunteer/admin/super_admin pass. Null role bypasses here on
  // purpose — (volunteer)/layout.tsx re-verifies against Supabase for users whose Clerk
  // JWT hasn't synced yet (e.g. right after a role change forces session revocation).
  if (isVolunteerRoute(req) && role !== "volunteer" && role !== "admin" && role !== "super_admin") {
    if (role !== null && role !== undefined) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Enrollee routes: block admins.
  if (isEnrolleeRoute(req) && (role === "admin" || role === "super_admin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // EARC routes: only earc_staff/admin/super_admin pass.
  if (isEarcRoute(req) && role !== "earc_staff" && role !== "admin" && role !== "super_admin") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Core member routes: only group_core_member/admin/super_admin pass.
  if (isCoreMemberRoute(req) && role !== "group_core_member" && role !== "admin" && role !== "super_admin") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
