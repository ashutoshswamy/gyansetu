import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { Plane, MapPin, Calendar, Users } from "lucide-react";

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)",     label: "Open" },
  closed:    { color: "#9B9188", bg: "rgba(90,82,71,0.08)",     label: "Closed" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)",    label: "Completed" },
  draft:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)",   label: "Draft" },
};

export default async function VolunteerToursPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db
    .from("users")
    .select("id")
    .eq("clerk_id", userId!)
    .single();

  const { data: assignments } = await db
    .from("volunteer_assignments")
    .select("*, tours(id, title, destination, start_date, end_date, capacity, status, description)")
    .eq("volunteer_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const active   = (assignments ?? []).filter((a: any) => a.tours?.status === "open");
  const past     = (assignments ?? []).filter((a: any) => ["completed", "closed"].includes(a.tours?.status));
  const upcoming = (assignments ?? []).filter((a: any) => a.tours?.status === "draft");

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My Tours</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            {(assignments ?? []).length} tour {(assignments ?? []).length === 1 ? "assignment" : "assignments"}
          </p>
        </div>

        {(assignments ?? []).length === 0 ? (
          <div className="py-20 text-center rounded-xl" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <Plane className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>No tour assignments yet.</p>
            <p style={{ fontSize: 12, color: "#C8C4BC", marginTop: 4 }}>An admin will assign you to tours when available.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <Section title="Active" assignments={active} />
            )}
            {upcoming.length > 0 && (
              <Section title="Upcoming" assignments={upcoming} />
            )}
            {past.length > 0 && (
              <Section title="Past" assignments={past} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, assignments }: { title: string; assignments: any[] }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9188", marginBottom: 12 }}>{title}</p>
      <div className="space-y-3">
        {assignments.map((a: any) => {
          const s = statusStyles[a.tours?.status ?? "draft"] ?? statusStyles.draft;
          return (
            <div key={a.id} className="rounded-xl p-5" style={{ background: "white", border: "1px solid #E4DFD1" }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 2 }}>{a.tours?.title}</p>
                  {a.role_description && (
                    <p style={{ fontSize: 12, color: "#5A5247" }}>Role: {a.role_description}</p>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: s.color, background: s.bg, flexShrink: 0, textTransform: "capitalize" }}>
                  {s.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: "#9B9188" }}>
                {a.tours?.destination && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{a.tours.destination}</span>
                )}
                {a.tours?.start_date && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(a.tours.start_date).toLocaleDateString()} → {a.tours.end_date ? new Date(a.tours.end_date).toLocaleDateString() : "TBD"}</span>
                )}
                {a.tours?.capacity && (
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{a.tours.capacity} seats</span>
                )}
              </div>

              {a.tours?.description && (
                <p style={{ fontSize: 13, color: "#5A5247", marginTop: 12, lineHeight: 1.6 }}>{a.tours.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
