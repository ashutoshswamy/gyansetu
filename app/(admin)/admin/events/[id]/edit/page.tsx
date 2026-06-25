import { createServerClient } from "@/lib/supabase/server";
import { EventForm } from "../../event-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: event, error }, { data: tours }] = await Promise.all([
    db.from("events").select("*").eq("id", id).single(),
    db.from("tours").select("id, title").order("created_at", { ascending: false }),
  ]);

  if (error || !event) notFound();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 mb-6 text-sm" style={{ color: "#9B9188" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Events
        </Link>
        <div className="mb-6">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Edit Event</h1>
          <p style={{ fontSize: 13, color: "#9B9188", marginTop: 2 }}>{event.title}</p>
        </div>
        <EventForm
          tours={tours ?? []}
          initialData={{
            id: event.id,
            title: event.title,
            description: event.description ?? undefined,
            event_type: event.event_type,
            tour_id: event.tour_id ?? undefined,
            event_date: event.event_date,
            event_time: event.event_time ?? undefined,
            location: event.location ?? undefined,
            status: event.status,
          }}
        />
      </div>
    </div>
  );
}
