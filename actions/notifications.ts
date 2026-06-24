"use server";

import { createServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const db = createServerClient();
  await db.from("notifications").update({ read: true }).eq("id", id);
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
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@gyansetu.in",
    to,
    subject,
    html,
  });

  if (error) { console.error("[sendEmail]", error); throw new Error("Failed to send email"); }
  return data;
}
