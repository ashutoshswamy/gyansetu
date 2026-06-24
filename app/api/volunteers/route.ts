import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: requestingUser } = await db.from("users").select("role").eq("clerk_id", userId).single();
  if (!requestingUser || !["admin", "super_admin"].includes(requestingUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await db
    .from("users")
    .select("id, name, email, role")
    .eq("role", "volunteer")
    .order("name");

  if (error) { console.error("[GET /api/volunteers]", error); return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 }); }
  return NextResponse.json({ volunteers: data ?? [] });
}
