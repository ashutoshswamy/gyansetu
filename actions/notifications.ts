"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAdminUser, getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { getClientIp } from "@/lib/rate-limit";

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

  const ip = await getClientIp();
  const { success: ipOk } = await markReadRatelimit.limit(`notif-read:ip:${ip}`);
  if (!ipOk) throw new Error("Too many requests. Please wait before trying again.");

  const { error } = await db.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  if (error) { console.error("[markNotificationRead]", error); throw new Error("Failed to mark notification read"); }
}

export async function markAllNotificationsRead() {
  const { db, user, userId } = await getAuthenticatedUser();

  const { success } = await markReadRatelimit.limit(`notif-read-all:${userId}`);
  if (!success) throw new Error("Too many requests. Please wait before trying again.");

  const { error } = await db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  if (error) { console.error("[markAllNotificationsRead]", error); throw new Error("Failed to mark notifications read"); }
}

// Notifies every current member of a group at once — used by admin actions that assign
// something to the group as a whole (kit, travel ticket, local host, workshop) rather
// than to one volunteer. Best-effort: callers should not let a notify failure block the
// underlying assignment (wrap in .catch), since the assignment itself already succeeded.
export async function notifyGroupMembers(
  groupId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info"
) {
  const { db } = await requireAdminUser();

  const { data: members, error } = await db.from("tour_group_members").select("user_id").eq("group_id", groupId);
  if (error) { console.error("[notifyGroupMembers]", error); throw new Error("Failed to load group members"); }
  if (!members || members.length === 0) return;

  const { error: insertError } = await db
    .from("notifications")
    .insert(members.map(m => ({ user_id: m.user_id, title, message, type })));
  if (insertError) { console.error("[notifyGroupMembers]", insertError); throw new Error("Failed to notify group"); }
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

  const ip = await getClientIp();
  const { success: ipOk } = await sendEmailRatelimit.limit(`send-email:ip:${ip}`);
  if (!ipOk) throw new Error("Too many requests. Please wait before trying again.");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@gyansetu.jnanaprabodhini.org",
    to,
    subject,
    html,
  });

  if (error) { console.error("[sendEmail]", error); throw new Error("Failed to send email"); }
  return data;
}
