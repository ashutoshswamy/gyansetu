import { auth } from "@clerk/nextjs/server";
import type { UserRole } from "@/types";

export async function getUserRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: UserRole })?.role ?? null;
}

export function isEnrolleeRole(role: UserRole | null): boolean {
  return role === null;
}
