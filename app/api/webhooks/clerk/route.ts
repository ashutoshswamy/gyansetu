import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

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

  let event: any;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createServerClient();
  const clerk = await clerkClient();

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    // New users get no role — they must pass a test to become a volunteer
    await db.from("users").insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address ?? "",
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      avatar_url: image_url,
      role: null,
    });
  }

  if (event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;
    await db.from("users").update({
      email: email_addresses[0]?.email_address ?? "",
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      avatar_url: image_url,
      updated_at: new Date().toISOString(),
    }).eq("clerk_id", id);
  }

  if (event.type === "user.deleted") {
    await db.from("users").delete().eq("clerk_id", event.data.id);
  }

  return NextResponse.json({ received: true });
}
