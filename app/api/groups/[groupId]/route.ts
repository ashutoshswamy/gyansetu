import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(_req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const db = createServerClient();
  const { data, error } = await db
    .from("tour_groups")
    .select("*, tours(id, title, destination), tour_group_members(*, users(id, name, email)), users!tour_groups_mentor_id_fkey(id, name, email)")
    .eq("id", groupId)
    .single();

  if (error) { console.error("[GET /api/groups]", error); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
  return NextResponse.json(data);
}
