import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/clerk/action-auth";

export async function GET(req: Request) {
  const { db } = await requireAdminUser();
  const url = new URL(req.url);
  const tourId = url.searchParams.get("tourId");
  const includeEnrollees = url.searchParams.get("includeEnrollees") === "1";

  let query = db
    .from("users")
    .select("id, name, email, role, volunteer_profiles!volunteer_profiles_user_id_fkey(photo_url)")
    .in("role", includeEnrollees ? ["volunteer", "enrollee"] : ["volunteer"])
    .order("name");

  if (tourId) {
    const { data: applications, error: appError } = await db
      .from("tour_applications")
      .select("student_id")
      .eq("tour_id", tourId)
      .eq("status", "selected");
    if (appError) { console.error("[GET /api/volunteers]", appError); return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 }); }
    const approvedIds = (applications ?? []).map((a) => a.student_id);
    // Enrollees haven't applied for the tour yet, so the "selected" filter only
    // narrows volunteers — an enrollee is eligible regardless of application status.
    query = includeEnrollees
      ? query.or(`role.eq.enrollee,id.in.(${approvedIds.length > 0 ? approvedIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
      : query.in("id", approvedIds.length > 0 ? approvedIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data, error } = await query;

  if (error) { console.error("[GET /api/volunteers]", error); return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 }); }
  return NextResponse.json({ volunteers: data ?? [] });
}
