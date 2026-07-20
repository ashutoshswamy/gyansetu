import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

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
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isVolunteerRoute = createRouteMatcher(["/volunteer(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);
const isEarcRoute = createRouteMatcher(["/earc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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

  // Volunteer routes: only volunteer/admin/super_admin pass. Block null-role users.
  if (isVolunteerRoute(req) && role !== "volunteer" && role !== "admin" && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Student routes: block admins.
  if (isStudentRoute(req) && (role === "admin" || role === "super_admin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // EARC routes: only earc_staff/admin/super_admin pass.
  if (isEarcRoute(req) && role !== "earc_staff" && role !== "admin" && role !== "super_admin") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
