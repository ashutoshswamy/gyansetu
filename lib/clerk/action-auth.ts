import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

async function resolveUserWithRole() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkRole = (sessionClaims?.metadata as { role?: UserRole })?.role ?? null;
  const db = createServerClient();

  const { data: selectData, error: selectError } = await db
    .from("users")
    .select("id, role")
    .eq("clerk_id", userId)
    .maybeSingle();
  let dbUser = selectData;

  if (selectError) throw new Error(`DB error: ${selectError.code} ${selectError.message}`);

  // User missing from Supabase (webhook missed) — backfill from Clerk profile
  if (!dbUser) {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

    // Email may already exist under a different row (e.g. webhook created row without clerk_id).
    // Link clerk_id to that row instead of inserting a duplicate.
    const { data: emailMatch } = await db
      .from("users")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (emailMatch) {
      await db.from("users").update({ clerk_id: userId }).eq("id", emailMatch.id);
      dbUser = emailMatch;
    } else {
      const { data: inserted, error: insertError } = await db
        .from("users")
        .insert({
          clerk_id: userId,
          email,
          name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
          avatar_url: clerkUser.imageUrl,
          role: clerkRole,
        })
        .select("id, role")
        .single();

      if (!inserted) {
        console.error(
          `[action-auth] backfill insert failed: code=${insertError?.code} message=${insertError?.message} details=${insertError?.details} hint=${insertError?.hint}`
        );
        throw new Error("Unauthorized");
      }
      dbUser = inserted;
    }
  }

  // Supabase has role — use it as source of truth
  if (dbUser.role) return { db, user: dbUser, userId };

  // Supabase null but Clerk has role — sync Supabase from Clerk
  if (clerkRole) {
    await db.from("users").update({ role: clerkRole }).eq("clerk_id", userId);
    return { db, user: { ...dbUser, role: clerkRole }, userId };
  }

  return { db, user: dbUser, userId };
}

export async function requireAdminUser() {
  const { db, user, userId } = await resolveUserWithRole();

  if (!user.role || !ADMIN_ROLES.includes(user.role as UserRole)) {
    throw new Error("Unauthorized");
  }

  return { db, user, userId };
}

export async function requireSuperAdminUser() {
  const { db, user, userId } = await resolveUserWithRole();

  if (user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  return { db, user, userId };
}

export async function requireVolunteerUser() {
  const { db, user } = await resolveUserWithRole();

  const allowed: string[] = ["volunteer", "admin", "super_admin"];
  if (!user.role || !allowed.includes(user.role)) {
    throw new Error("Unauthorized");
  }

  return { db, user };
}

export async function requireEarcUser() {
  const { db, user, userId } = await resolveUserWithRole();

  const allowed: string[] = ["earc_staff", "admin", "super_admin"];
  if (!user.role || !allowed.includes(user.role)) {
    throw new Error("Unauthorized");
  }

  return { db, user, userId };
}

export async function getAuthenticatedUser() {
  return resolveUserWithRole();
}
