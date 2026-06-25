import { createServerClient } from "@/lib/supabase/server";
import { EventForm } from "../event-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  const db = createServerClient();
  const { data: tours } = await db
    .from("tours")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Events
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>New Event</h1>
        </div>
        <EventForm tours={tours ?? []} />
      </div>
    </div>
  );
}
