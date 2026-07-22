import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { clerkClient, type WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["enrollee", "volunteer", "admin", "earc_staff", "super_admin"];

export async function POST(req: Request) {
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "No svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET ?? "");

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createServerClient();

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    // New users start as enrollee — they must pass a test to become a volunteer
    await db.from("users").insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address ?? "",
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      avatar_url: image_url,
      role: "enrollee",
    });

    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(id, { publicMetadata: { role: "enrollee" } });
  }

  if (event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = event.data;

    const update: Record<string, unknown> = {
      email: email_addresses[0]?.email_address ?? "",
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      avatar_url: image_url,
      updated_at: new Date().toISOString(),
    };

    // Someone edited publicMetadata.role directly in the Clerk dashboard —
    // Supabase is the source of truth everywhere else in the app, so pull it in here.
    const metadataRole = public_metadata?.role as UserRole | undefined;
    if (metadataRole && VALID_ROLES.includes(metadataRole)) {
      update.role = metadataRole;
    }

    await db.from("users").update(update).eq("clerk_id", id);
  }

  if (event.type === "user.deleted") {
    await db.from("users").delete().eq("clerk_id", event.data.id);
  }

  return NextResponse.json({ received: true });
}
