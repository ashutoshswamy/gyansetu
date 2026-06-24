import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId).single();
  if (!user) return NextResponse.json([]);

  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) { console.error("[GET /api/notifications]", error); return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 }); }
  return NextResponse.json(data);
}
