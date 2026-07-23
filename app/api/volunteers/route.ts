import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/clerk/action-auth";

export async function GET() {
  const { db } = await requireAdminUser();

  const { data, error } = await db
    .from("users")
    .select("id, name, email, role, volunteer_profiles!volunteer_profiles_user_id_fkey(photo_url)")
    .eq("role", "volunteer")
    .order("name");

  if (error) { console.error("[GET /api/volunteers]", error); return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 }); }
  return NextResponse.json({ volunteers: data ?? [] });
}
