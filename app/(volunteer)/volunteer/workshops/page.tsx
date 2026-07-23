import { getUpcomingWorkshops, getMyWorkshopAttendance } from "@/actions/workshops";
import { GraduationCap } from "lucide-react";
import { MissedSummaryForm } from "./missed-summary-form";

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
  pending:     { color: "#F5A520", bg: "rgba(245,165,32,0.1)", label: "Makeup: Pending" },
  allowed:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)", label: "Makeup: Allowed" },
  not_allowed: { color: "#DC2626", bg: "rgba(220,38,38,0.08)", label: "Makeup: Not Allowed" },
};

export default async function VolunteerWorkshopsPage() {
  const [workshops, myAttendance] = await Promise.all([
    getUpcomingWorkshops(),
    getMyWorkshopAttendance(),
  ]);

  const attendanceMap = new Map(myAttendance.map(a => [a.workshop_id, a]));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Workshops</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Training schedule and your attendance</p>
        </div>

        <div className="space-y-3">
          {workshops.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 15, color: "#5A5247" }}>No workshops scheduled yet.</p>
            </div>
          )}
          {workshops.map(w => {
            const t = typeColors[w.workshop_type] ?? typeColors.other;
            const a = attendanceMap.get(w.id);
            const status = a?.attendance_status ?? "pending";
            const sc = statusColors[status] ?? statusColors.pending;
            const showMissedForm = status !== "present";
            return (
              <div key={w.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px" }}>
                <div className="flex items-start gap-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap size={18} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{w.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: t.color, background: t.bg }}>{t.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: sc.color, background: sc.bg, textTransform: "capitalize" }}>{status}</span>
                      {a?.makeup_decision && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: makeupColors[a.makeup_decision]?.color, background: makeupColors[a.makeup_decision]?.bg }}>
                          {makeupColors[a.makeup_decision]?.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#9B9188" }}>
                      {new Date(w.workshop_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                      {w.workshop_time ? ` · ${w.workshop_time}` : ""}
                      {w.hall_location ? ` · ${w.hall_location}` : ""}
                      {w.trainer?.name || w.trainer_name ? ` · Trainer: ${w.trainer?.name ?? w.trainer_name}` : ""}
                    </div>
                    {a?.missed_summary && (
                      <p style={{ fontSize: 13, color: "#5A5247", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                        <span style={{ fontWeight: 600, color: "#9B9188" }}>Your summary: </span>{a.missed_summary}
                      </p>
                    )}
                    {showMissedForm && !a?.missed_summary && (
                      <div style={{ marginTop: 8 }}>
                        <MissedSummaryForm workshopId={w.id} />
                      </div>
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
