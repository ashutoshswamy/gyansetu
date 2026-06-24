import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserRole } from "@/types";

export async function getUserRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: UserRole })?.role ?? null;
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<UserRole> {
  const role = await getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Unauthorized");
  }
  return role;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin" || role === "super_admin";
}

export async function getAuthUser() {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
