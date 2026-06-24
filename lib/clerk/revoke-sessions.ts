"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function revokeAllUserSessions(clerkUserId: string): Promise<void> {
  const clerk = await clerkClient();
  const { data: sessions } = await clerk.sessions.getSessionList({ userId: clerkUserId, status: "active" });
  await Promise.all(sessions.map((s) => clerk.sessions.revokeSession(s.id)));
}
