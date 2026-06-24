import { createServerClient } from "@/lib/supabase/server";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", color: "#4A55BE", bg: "rgba(74,85,190,0.10)" },
  ongoing:  { label: "Ongoing",  color: "#2A5E3A", bg: "rgba(42,94,58,0.10)"  },
  completed:{ label: "Completed",color: "#9B9188", bg: "rgba(155,145,136,0.12)"},
} as const;

function StatusBadge({ status }: { status: Visit["status"] }) {
  const s = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 4,
      color: s.color,
      background: s.bg,
      textTransform: "capitalize",
      letterSpacing: "0.04em",
      display: "inline-block",
    }}>
      {s.label}
    </span>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E4DFD1",
      borderRadius: 12,
      padding: "24px 26px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "box-shadow 0.2s",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#19140F",
            margin: "0 0 4px",
            lineHeight: 1.3,
          }}>
            {visit.title}
          </h3>
          <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>
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
        fontSize: 12.5,
        color: "#9B9188",
        fontWeight: 500,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{formatDate(visit.start_date)}</span>
        <span style={{ color: "#E4DFD1" }}>→</span>
        <span>{formatDate(visit.end_date)}</span>
        {visit.capacity != null && (
          <>
            <span style={{ color: "#E4DFD1", marginLeft: 8 }}>·</span>
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
          fontSize: 13.5,
          color: "#5A5247",
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
              fontSize: 12.5,
              fontWeight: 600,
              color: "#4A55BE",
              textDecoration: "none",
              padding: "6px 13px",
              borderRadius: 5,
              border: "1.5px solid rgba(74,85,190,0.25)",
              background: "rgba(74,85,190,0.04)",
              transition: "border-color 0.18s, background 0.18s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9B9188", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: "#E4DFD1" }} />
        <span style={{ fontSize: 12, color: "#9B9188", fontWeight: 500 }}>{visits.length}</span>
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
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { background: #FAFAF7; margin: 0; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
        {/* Page header */}
        <div style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E4DFD1",
          padding: "48px 24px 40px",
        }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#F5A520",
              margin: "0 0 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ display: "inline-block", width: 24, height: 1.5, background: "#F5A520" }} />
              Jnana Pravas Schedule
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(36px, 5vw, 54px)",
              fontWeight: 600,
              color: "#19140F",
              margin: "0 0 10px",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}>
              Upcoming Visits
            </h1>
            <p style={{ fontSize: 15, color: "#5A5247", margin: 0, lineHeight: 1.6 }}>
              Jnanaprabodhini volunteer visits to remote parts of India — science workshops, cultural exchanges, and knowledge bridges.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" }}>
          {isEmpty ? (
            <div style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "#FFFFFF",
              border: "1px solid #E4DFD1",
              borderRadius: 12,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#F3F0E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9B9188" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: "0 0 6px" }}>No visits scheduled</p>
              <p style={{ fontSize: 14, color: "#9B9188", margin: 0 }}>Check back soon for upcoming Jnana Pravas visits.</p>
            </div>
          ) : (
            <>
              <Section title="Currently Ongoing" visits={ongoing} />
              <Section title="Upcoming" visits={upcoming} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
