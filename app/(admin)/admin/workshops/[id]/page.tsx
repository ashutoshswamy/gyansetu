import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getWorkshopAttendees } from "@/actions/workshops";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { MarkAttendanceButtons, MakeupDecisionButtons } from "../attendance-actions";

const typeColors: Record<string, { color: string; bg: string; label: string }> = {
  science:              { color: "#4A55BE", bg: "rgba(74,85,190,0.08)", label: "Science" },
  mathematics:          { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)", label: "Mathematics" },
  exhibition_cultural:  { color: "#6B21A8", bg: "rgba(107,33,168,0.08)", label: "Exhibition & Cultural" },
  other:                { color: "#5A5247", bg: "rgba(90,82,71,0.08)", label: "Other" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#9B9188", bg: "rgba(155,145,136,0.1)" },
  present: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  absent:  { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  excused: { color: "#F5A520", bg: "rgba(245,165,32,0.1)" },
};

const makeupColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#F5A520", bg: "rgba(245,165,32,0.1)", label: "Pending" },
  allowed:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)", label: "Allowed" },
  not_allowed: { color: "#DC2626", bg: "rgba(220,38,38,0.08)", label: "Not Allowed" },
};

export default async function AdminWorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: workshop }, attendees, volunteersRes] = await Promise.all([
    db.from("workshops").select("*, trainer:users!workshops_trainer_id_fkey(id, name, email)").eq("id", id).single(),
    getWorkshopAttendees(id),
    db.from("users").select("id, name, email").eq("role", "volunteer").order("name"),
  ]);

  if (!workshop) {
    return (
      <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
        <p style={{ color: "#5A5247" }}>Workshop not found.</p>
      </div>
    );
  }

  const t = typeColors[workshop.workshop_type] ?? typeColors.other;
  const attendeeMap = new Map(attendees.map(a => [a.volunteer_id, a]));
  const allVolunteers = volunteersRes.data ?? [];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/workshops" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A5247", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Workshops
        </Link>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div className="flex items-start gap-4">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GraduationCap size={22} style={{ color: t.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>{workshop.title}</h1>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: t.color, background: t.bg }}>{t.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#5A5247", background: "#FAFAF7", border: "1px solid #E4DFD1", textTransform: "capitalize" }}>{workshop.status}</span>
              </div>
              <p style={{ fontSize: 13, color: "#5A5247", margin: "4px 0 0" }}>
                {new Date(workshop.workshop_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                {workshop.workshop_time ? ` · ${workshop.workshop_time}` : ""}
                {workshop.hall_location ? ` · ${workshop.hall_location}` : ""}
              </p>
              <p style={{ fontSize: 13, color: "#5A5247", margin: "2px 0 0" }}>
                Trainer: {workshop.trainer?.name ?? "Not assigned"}
                {" · "}
                Kit: <span style={{ color: workshop.kit_ready ? "#2A5E3A" : "#9B9188", fontWeight: 600 }}>{workshop.kit_ready ? "Ready" : "Not Ready"}</span>
              </p>
              {workshop.plan_notes && (
                <p style={{ fontSize: 13, color: "#5A5247", margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{workshop.plan_notes}</p>
              )}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 12px" }}>Attendance</h2>
        <div className="space-y-3">
          {allVolunteers.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No volunteers found.</p>
          )}
          {allVolunteers.map((v: { id: string; name: string; email: string }) => {
            const a = attendeeMap.get(v.id);
            const status = a?.attendance_status ?? "pending";
            const sc = statusColors[status] ?? statusColors.pending;
            return (
              <div key={v.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{v.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: sc.color, background: sc.bg, textTransform: "capitalize" }}>{status}</span>
                      {a?.makeup_decision && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: makeupColors[a.makeup_decision]?.color, background: makeupColors[a.makeup_decision]?.bg }}>
                          Makeup: {makeupColors[a.makeup_decision]?.label}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>{v.email}</p>
                    {a?.missed_summary && (
                      <p style={{ fontSize: 13, color: "#5A5247", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                        <span style={{ fontWeight: 600, color: "#9B9188" }}>Missed summary: </span>{a.missed_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <MarkAttendanceButtons workshopId={id} volunteerId={v.id} />
                    {a?.missed_summary && a?.makeup_decision === "pending" && (
                      <MakeupDecisionButtons workshopId={id} volunteerId={v.id} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
