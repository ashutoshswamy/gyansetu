import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/clerk/action-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  let db, user;
  try {
    ({ db, user } = await getAuthenticatedUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const { data, error } = await db
    .from("tour_groups")
    .select("*, tours(id, title, destination), tour_group_members(*, users(id, name, email)), users!tour_groups_mentor_id_fkey(id, name, email)")
    .eq("id", groupId)
    .single();

  if (error) { console.error("[GET /api/groups]", error); return NextResponse.json({ error: "Not found" }, { status: 404 }); }

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isMentor = data.mentor_id === user.id;
  const isMember = (data.tour_group_members as { user_id: string }[] | null)?.some((m) => m.user_id === user.id);
  if (!isAdmin && !isMentor && !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(data);
}
