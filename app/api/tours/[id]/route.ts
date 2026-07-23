import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/clerk/action-auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let db, user;
  try {
    ({ db, user } = await getAuthenticatedUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await db
    .from("tours")
    .select("id, title, destination, start_date, end_date, status, description, capacity, eligibility_test_id")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPrivileged = user.role === "admin" || user.role === "super_admin" || user.role === "volunteer";
  if (data.status !== "open" && !isPrivileged) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
