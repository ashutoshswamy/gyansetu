import { createServerClient } from "@/lib/supabase/server";
import { Calendar, MapPin, Tag } from "lucide-react";
import type { Event } from "@/types";

type EventRow = Event & { tours?: { id: string; title: string } | null };

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

export default async function VolunteerEventsPage() {
  const db = createServerClient();

  const { data: events } = await db
    .from("events")
    .select("*, tours(id, title)")
    .order("event_date", { ascending: true });

  const upcoming = (events ?? []).filter((e: EventRow) => ["upcoming", "ongoing"].includes(e.status));
  const past = (events ?? []).filter((e: EventRow) => !["upcoming", "ongoing"].includes(e.status));

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Events</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Katta, Melawa, training sessions and more</p>
        </div>

        <section className="mb-8">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#2A5E3A", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Upcoming & Ongoing ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 && <p style={{ color: "#9B9188", fontSize: 14 }}>No upcoming events.</p>}
            {upcoming.map((event: EventRow) => <EventCard key={event.id} event={event} />)}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9B9188", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Past ({past.length})
          </h2>
          <div className="space-y-3">
            {past.length === 0 && <p style={{ color: "#9B9188", fontSize: 14 }}>No past events.</p>}
            {past.map((event: EventRow) => <EventCard key={event.id} event={event} muted />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function EventCard({ event, muted }: { event: EventRow; muted?: boolean }) {
  const t = typeColors[event.event_type] ?? typeColors.other;
  return (
    <div style={{ background: muted ? "#F3F0E8" : "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 18px", opacity: muted ? 0.75 : 1 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }} className="truncate">{event.title}</h3>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: t.color, background: t.bg, textTransform: "capitalize", flexShrink: 0 }}>
              {event.event_type}
            </span>
          </div>
          {event.description && <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 8px" }}>{event.description}</p>}
          <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
            <span className="flex items-center gap-1"><Calendar size={11} /> {event.event_date}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>}
            {event.tours?.title && <span className="flex items-center gap-1"><Tag size={11} /> {event.tours.title}</span>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, background: muted ? "rgba(90,82,71,0.1)" : "rgba(42,94,58,0.08)", color: muted ? "#9B9188" : "#2A5E3A", textTransform: "capitalize", flexShrink: 0 }}>
          {event.status}
        </span>
      </div>
    </div>
  );
}
