import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, Eyebrow } from "@/components/landing/theme";
import { formatDateRange } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Tour Showcase",
  description: "Explore Gyan-Setu's past and upcoming educational tours and student visits across India.",
  alternates: { canonical: "/visits" },
};

type Visit = {
  id: string;
  title: string;
  destination: string;
  state: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  timetable_url: string | null;
  status: "upcoming" | "ongoing" | "completed";
  capacity: number | null;
  created_at: string;
};

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", color: "var(--gs-marigold)", bg: "rgba(232,163,61,.12)", border: "rgba(232,163,61,.4)" },
  ongoing:  { label: "Ongoing",  color: "var(--gs-rust)",     bg: "rgba(184,73,46,.12)",  border: "rgba(184,73,46,.4)"  },
  completed:{ label: "Completed",color: "var(--gs-text-mute)",bg: "var(--gs-paper)",      border: "var(--gs-line)"      },
} as const;

function StatusBadge({ status }: { status: Visit["status"] }) {
  const s = STATUS_CONFIG[status];
  return (
    <span style={{
      fontFamily: F_MONO,
      fontSize: 10.5,
      fontWeight: 600,
      padding: "4px 11px",
      borderRadius: 20,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      display: "inline-block",
      flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  return (
    <div style={{
      background: "var(--gs-paper-deep)",
      border: "1px dashed var(--gs-line)",
      borderRadius: 4,
      padding: "24px 26px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: F_DISPLAY,
            fontSize: 19,
            fontWeight: 600,
            color: "var(--gs-text)",
            margin: "0 0 4px",
            lineHeight: 1.3,
          }}>
            {visit.title}
          </h3>
          <p style={{ fontFamily: F_MONO, fontSize: 12, color: "var(--gs-text-mute)", margin: 0, letterSpacing: "0.02em" }}>
            {visit.destination}{visit.state ? `, ${visit.state}` : ""}
          </p>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      {/* Dates */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: F_MONO,
        fontSize: 12,
        color: "var(--gs-text-mute)",
        fontWeight: 500,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{formatDateRange(visit.start_date, visit.end_date)}</span>
        {visit.capacity != null && (
          <>
            <span style={{ color: "var(--gs-line)", marginLeft: 8 }}>&middot;</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span>{visit.capacity} seats</span>
          </>
        )}
      </div>

      {/* Description */}
      {visit.description && (
        <p style={{
          fontFamily: F_BODY,
          fontSize: 13.5,
          color: "var(--gs-text-soft)",
          lineHeight: 1.65,
          margin: 0,
        }}>
          {visit.description}
        </p>
      )}

      {/* Timetable link */}
      {visit.timetable_url && (
        <div style={{ marginTop: 4 }}>
          <a
            href={visit.timetable_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: F_MONO,
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--gs-text-mute)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid var(--gs-line)",
              background: "var(--gs-paper)",
              letterSpacing: "0.02em",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            View Timetable
          </a>
        </div>
      )}
    </div>
  );
}

function Section({ title, visits }: { title: string; visits: Visit[] }) {
  if (visits.length === 0) return null;
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 600, color: "var(--gs-text-mute)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: "var(--gs-line)" }} />
        <span style={{ fontFamily: F_MONO, fontSize: 11.5, color: "var(--gs-text-mute)", fontWeight: 500 }}>{visits.length}</span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 16,
      }}>
        {visits.map((v) => <VisitCard key={v.id} visit={v} />)}
      </div>
    </div>
  );
}

export const revalidate = 60;

export default async function VisitsPage() {
  const db = createServerClient();
  const { data: visits } = await db
    .from("visits")
    .select("*")
    .in("status", ["upcoming", "ongoing"])
    .order("start_date", { ascending: true });

  const all = (visits ?? []) as Visit[];
  const ongoing  = all.filter((v) => v.status === "ongoing");
  const upcoming = all.filter((v) => v.status === "upcoming");
  const isEmpty  = all.length === 0;

  return (
    <main className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)" }}>
      {/* Page header */}
      <div style={{
        background: "var(--gs-ink)",
        padding: "64px 24px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--gs-line-ink) 1px,transparent 1px),linear-gradient(90deg,var(--gs-line-ink) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Eyebrow>Gyan-Setu Visit</Eyebrow>
          <h1 style={{
            fontFamily: F_DISPLAY,
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            color: "var(--gs-paper)",
            margin: "0 0 12px",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}>
            Visits
          </h1>
          <p style={{ fontFamily: F_BODY, fontSize: 15.5, color: "rgba(251,247,236,.62)", margin: 0, lineHeight: 1.65, maxWidth: 620 }}>
            Volunteer visits to remote parts of India - conducting science workshops, facilitating cultural exchanges, and building bridges through knowledge.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 96px" }}>
        {isEmpty ? (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            background: "var(--gs-paper-deep)",
            border: "1px dashed var(--gs-line)",
            borderRadius: 4,
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--gs-paper)",
              border: "1px solid var(--gs-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gs-text-mute)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p style={{ fontFamily: F_DISPLAY, fontSize: 19, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 6px" }}>No visits scheduled</p>
            <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-mute)", margin: 0 }}>Check back soon for upcoming Gyan-Setu visits.</p>
          </div>
        ) : (
          <>
            <Section title="Currently Ongoing" visits={ongoing} />
            <Section title="Upcoming" visits={upcoming} />
          </>
        )}
      </div>
    </main>
  );
}
