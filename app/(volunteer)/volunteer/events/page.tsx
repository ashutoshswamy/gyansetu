import { createServerClient } from "@/lib/supabase/server";
import { getMyEventRsvps } from "@/actions/events";
import { Calendar, MapPin, Tag, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import type { Event, EventAttendee } from "@/types";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { RsvpButtons } from "./rsvp-buttons";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";

type EventRow = Event & { tours?: { id: string; title: string } | null };

const rsvpLabels: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.1)", label: "No response" },
  confirmed: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Will attend" },
  maybe:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)", label: "Maybe" },
  absent:    { color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)", label: "Will not attend" },
  attended:  { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Attended" },
};

const typeColors: Record<string, { color: string; bg: string }> = {
  katta:        { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  melawa:       { color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
  training:     { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  workshop:     { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  meeting:      { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)" },
  demo:         { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  presentation: { color: "#1E5A8A", bg: "rgba(30,90,138,0.08)" },
  celebration:  { color: "#B45309", bg: "rgba(180,83,9,0.08)" },
  other:        { color: "var(--gs-text-secondary)", bg: "rgba(90,82,71,0.08)" },
};

export default async function VolunteerEventsPage() {
  const db = createServerClient();

  const [{ data: events }, myRsvps] = await Promise.all([
    db.from("events").select("*, tours(id, title)").order("event_date", { ascending: true }),
    getMyEventRsvps(),
  ]);

  const rsvpMap = new Map((myRsvps as EventAttendee[]).map(r => [r.event_id, r]));

  const upcoming = (events ?? []).filter((e: EventRow) => ["upcoming", "ongoing"].includes(e.status));
  const past = (events ?? []).filter((e: EventRow) => !["upcoming", "ongoing"].includes(e.status));

  const totalCount = (events ?? []).length;
  const upcomingCount = upcoming.length;
  const attendingCount = (myRsvps as EventAttendee[]).filter(r => r.rsvp_status === "confirmed").length;
  const notAttendingCount = (myRsvps as EventAttendee[]).filter(r => r.rsvp_status === "absent").length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Events</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Katta, Melawa, training sessions and more</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Events" value={totalCount} icon={<Calendar size={20} />} accent="indigo" />
          <StatCard label="Upcoming" value={upcomingCount} icon={<CalendarClock size={20} />} accent="sky" />
          <StatCard label="Attending" value={attendingCount} icon={<CheckCircle2 size={20} />} accent="emerald" />
          <StatCard label="Not Attending" value={notAttendingCount} icon={<XCircle size={20} />} accent="rose" />
        </div>

        <section className="mb-8">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-success)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Upcoming & Ongoing ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 && <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>No upcoming events.</p>}
            {upcoming.map((event: EventRow) => <EventCard key={event.id} event={event} rsvp={rsvpMap.get(event.id)?.rsvp_status} showRsvp />)}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Past ({past.length})
          </h2>
          <div className="space-y-3">
            {past.length === 0 && <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>No past events.</p>}
            {past.map((event: EventRow) => <EventCard key={event.id} event={event} rsvp={rsvpMap.get(event.id)?.rsvp_status} muted />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function EventCard({ event, muted, rsvp, showRsvp }: { event: EventRow; muted?: boolean; rsvp?: string; showRsvp?: boolean }) {
  const t = typeColors[event.event_type] ?? typeColors.other;
  const rc = rsvpLabels[rsvp ?? "pending"] ?? rsvpLabels.pending;
  return (
    <div style={{ background: muted ? "var(--gs-card)" : "white", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", opacity: muted ? 0.75 : 1 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }} className="truncate">{event.title}</h3>
            <Badge style={{color: t.color, background: t.bg, textTransform: "capitalize", flexShrink: 0}}>
              {event.event_type}
            </Badge>
            {rsvp && (
              <Badge style={{color: rc.color, background: rc.bg, flexShrink: 0}}>
                {rc.label}
              </Badge>
            )}
          </div>
          {event.description && <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 8px" }}>{event.description}</p>}
          <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
            <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(event.event_date)}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>}
            {event.tours?.title && <span className="flex items-center gap-1"><Tag size={11} /> {event.tours.title}</span>}
          </div>
          {showRsvp && (
            <div style={{ marginTop: 10 }}>
              <RsvpButtons eventId={event.id} current={rsvp} />
            </div>
          )}
        </div>
        <Badge style={{background: muted ? "rgba(90, 82, 71, 0.1)" : "rgba(var(--gs-success-rgb), 0.08)", color: muted ? "var(--gs-muted)" : "var(--gs-success)", textTransform: "capitalize", flexShrink: 0}}>
          {event.status}
        </Badge>
      </div>
    </div>
  );
}
