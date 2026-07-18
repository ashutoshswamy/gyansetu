import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, MapPin, Tag, Clock } from "lucide-react";
import type { Event } from "@/types";
import { DeleteEventButton } from "@/components/features/events/delete-event-button";

const typeColors: Record<string, { color: string; bg: string }> = {
  katta:        { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  training:     { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  workshop:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  meeting:      { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  demo:         { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  presentation: { color: "#1E5A8A", bg: "rgba(30,90,138,0.08)" },
  celebration:  { color: "#B45309", bg: "rgba(180,83,9,0.08)" },
  other:        { color: "#5A5247", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  upcoming:  { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  ongoing:   { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  completed: { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  cancelled: { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

type EventWithTour = Omit<Event, "tour"> & { tours?: { id: string; title: string } };

export default async function AdminEventsPage() {
  const db = createServerClient();
  const { data: events } = await db
    .from("events")
    .select("*, tours(id, title)")
    .order("event_date", { ascending: true });

  const upcoming = (events ?? []).filter((e: EventWithTour) => e.status === "upcoming");
  const past = (events ?? []).filter((e: EventWithTour) => e.status !== "upcoming");

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Events</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              Katta, Melawa, training sessions, workshops, presentations
            </p>
          </div>
          <Link href="/admin/events/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Event
            </button>
          </Link>
        </div>

        {/* Upcoming */}
        <div className="mb-8">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#5A5247", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p style={{ color: "#9B9188", fontSize: 14, padding: "24px 0" }}>No upcoming events.</p>
            )}
            {upcoming.map((event: EventWithTour) => <EventRow key={event.id} event={event} />)}
          </div>
        </div>

        {/* Past */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#5A5247", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Past & Ongoing ({past.length})
          </h2>
          <div className="space-y-3">
            {past.length === 0 && (
              <p style={{ color: "#9B9188", fontSize: 14, padding: "24px 0" }}>No past events.</p>
            )}
            {past.map((event: EventWithTour) => <EventRow key={event.id} event={event} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: EventWithTour }) {
  const t = typeColors[event.event_type] ?? typeColors.other;
  const s = statusColors[event.status] ?? statusColors.upcoming;
  return (
    <div
      className="flex items-center justify-between"
      style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }} className="truncate">{event.title}</h3>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: t.color, background: t.bg, textTransform: "capitalize", flexShrink: 0 }}>
            {event.event_type}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize", flexShrink: 0 }}>
            {event.status}
          </span>
        </div>
        <div className="flex gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
          <span className="flex items-center gap-1"><Calendar size={11} /> {event.event_date}</span>
          {event.event_time && <span className="flex items-center gap-1"><Clock size={11} /> {event.event_time}</span>}
          {event.location && <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>}
          {event.tours?.title && <span className="flex items-center gap-1"><Tag size={11} /> {event.tours.title}</span>}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Link href={`/admin/events/${event.id}/edit`}>
          <button style={{ background: "transparent", color: "#4A55BE", fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
            Edit
          </button>
        </Link>
        <DeleteEventButton eventId={event.id} />
      </div>
    </div>
  );
}
