"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";

const resend = new Resend(process.env.RESEND_API_KEY);

const markReadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(30, "1 m"),
});

const sendEmailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "1 h"),
});

export async function createNotification({
  user_id,
  title,
  message,
  type = "info",
}: {
  user_id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}) {
  await requireAdminUser();
  const db = createServerClient();

  const { data, error } = await db
    .from("notifications")
    .insert({ user_id, title, message, type })
    .select()
    .single();

  if (error) { console.error("[createNotification]", error); throw new Error("Failed to create notification"); }
  return data;
}

export async function markNotificationRead(id: string) {
  const { db, user, userId } = await getAuthenticatedUser();

  const { success } = await markReadRatelimit.limit(`notif-read:${userId}`);
  if (!success) throw new Error("Too many requests. Please wait before trying again.");

  await db.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { userId } = await requireAdminUser();

  const { success } = await sendEmailRatelimit.limit(`send-email:${userId}`);
  if (!success) throw new Error("Too many requests. Please wait before trying again.");

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@gyansetu.in",
    to,
    subject,
    html,
  });

  if (error) { console.error("[sendEmail]", error); throw new Error("Failed to send email"); }
  return data;
}
