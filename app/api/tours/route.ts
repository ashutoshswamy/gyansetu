import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/client";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (status === "open") {
    const cached = await getCached(CACHE_KEYS.activeTours);
    if (cached) return NextResponse.json(cached);
  }

  const db = createServerClient();
  let query = db.from("tours").select("*").order("start_date");
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) { console.error("[GET /api/tours]", error); return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 }); }

  if (status === "open") {
    await setCached(CACHE_KEYS.activeTours, data, CACHE_TTL.medium);
  }

  return NextResponse.json(data);
}
