import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { deleteVisit } from "@/actions/visits";

type Visit = {
  id: string;
  title: string;
  destination: string;
  state: string | null;
  start_date: string;
  end_date: string;
  status: "upcoming" | "ongoing" | "completed";
  capacity: number | null;
  created_at: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE = {
  upcoming:  { color: "#4A55BE", bg: "rgba(74,85,190,0.10)"  },
  ongoing:   { color: "#2A5E3A", bg: "rgba(42,94,58,0.10)"   },
  completed: { color: "#9B9188", bg: "rgba(155,145,136,0.12)"},
} as const;

export default async function AdminVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const db = createServerClient();

  let query = db.from("visits").select("*").order("start_date", { ascending: true });
  if (filterStatus && ["upcoming", "ongoing", "completed"].includes(filterStatus)) {
    query = query.eq("status", filterStatus);
  }

  const { data: visits } = await query;
  const all = (visits ?? []) as Visit[];

  const counts = {
    all: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  };
  // Get counts separately for the filter tabs
  const { data: allVisits } = await db.from("visits").select("status");
  (allVisits ?? []).forEach((v: { status: string }) => {
    counts.all++;
    if (v.status === "upcoming") counts.upcoming++;
    else if (v.status === "ongoing") counts.ongoing++;
    else if (v.status === "completed") counts.completed++;
  });

  const filters: { label: string; value: string; count: number }[] = [
    { label: "All",       value: "",          count: counts.all       },
    { label: "Upcoming",  value: "upcoming",  count: counts.upcoming  },
    { label: "Ongoing",   value: "ongoing",   count: counts.ongoing   },
    { label: "Completed", value: "completed", count: counts.completed },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#9B9188",
              margin: "0 0 4px",
            }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: "0 0 4px" }}>Visits</h1>
            <p style={{ fontSize: 14, color: "#5A5247", margin: 0 }}>{counts.all} total visits</p>
          </div>
          <Link href="/admin/visits/new">
            <button style={{
              background: "#4A55BE",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Visit
            </button>
          </Link>
        </div>

        {/* Status filter tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "#F3F0E8",
          padding: 4,
          borderRadius: 8,
          width: "fit-content",
        }}>
          {filters.map((f) => {
            const isActive = (filterStatus ?? "") === f.value;
            return (
              <Link
                key={f.value}
                href={f.value ? `/admin/visits?status=${f.value}` : "/admin/visits"}
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#19140F" : "#9B9188",
                  background: isActive ? "#FFFFFF" : "transparent",
                  padding: "6px 14px",
                  borderRadius: 5,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? "#5A5247" : "#9B9188",
                  background: isActive ? "#F3F0E8" : "rgba(0,0,0,0.06)",
                  padding: "1px 6px",
                  borderRadius: 3,
                }}>
                  {f.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Visits list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {all.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "56px 24px",
              background: "#FFFFFF",
              border: "1px solid #E4DFD1",
              borderRadius: 10,
              color: "#9B9188",
              fontSize: 14,
            }}>
              No visits found. <Link href="/admin/visits/new" style={{ color: "#4A55BE", textDecoration: "none", fontWeight: 500 }}>Create one</Link>.
            </div>
          )}

          {all.map((visit) => {
            const s = STATUS_STYLE[visit.status];
            return (
              <div
                key={visit.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4DFD1",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }} className="truncate">
                      {visit.title}
                    </h3>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: s.color,
                      background: s.bg,
                      textTransform: "capitalize",
                      flexShrink: 0,
                    }}>
                      {visit.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9B9188", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {visit.destination}{visit.state ? `, ${visit.state}` : ""}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {formatDate(visit.start_date)} → {formatDate(visit.end_date)}
                    </span>
                    {visit.capacity != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        </svg>
                        {visit.capacity} seats
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete form */}
                <form
                  action={async () => {
                    "use server";
                    await deleteVisit(visit.id);
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      background: "transparent",
                      color: "#9B9188",
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "7px 13px",
                      borderRadius: 5,
                      border: "1.5px solid #E4DFD1",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    title="Delete visit"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                    Delete
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
