import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/clerk/action-auth";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/client";

export async function GET(req: Request) {
  let db, user;
  try {
    ({ db, user } = await getAuthenticatedUser());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (status && status !== "open" && user.role !== "admin" && user.role !== "super_admin" && user.role !== "volunteer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (status === "open") {
    const cached = await getCached(CACHE_KEYS.activeTours);
    if (cached) return NextResponse.json(cached);
  }

  let query = db.from("tours").select("*").order("start_date");
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) { console.error("[GET /api/tours]", error); return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 }); }

  if (status === "open") {
    await setCached(CACHE_KEYS.activeTours, data, CACHE_TTL.medium);
  }

  return NextResponse.json(data);
}
