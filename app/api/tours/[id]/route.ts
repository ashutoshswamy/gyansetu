import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createServerClient();

  const { data, error } = await db
    .from("tours")
    .select("id, title, destination, start_date, end_date, status, description, capacity, eligibility_test_id")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
