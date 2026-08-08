import { getUpcomingWorkshops, getMyWorkshopAttendance } from "@/actions/workshops";
import { GraduationCap, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { MissedSummaryForm } from "./missed-summary-form";
import { AttendedButton } from "./attended-button";
import { StatCard } from "@/components/features/dashboard/stat-card";

const typeColors: Record<string, { color: string; bg: string; label: string }> = {
  science:              { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Science" },
  mathematics:          { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Mathematics" },
  exhibition_cultural:  { color: "#6B21A8", bg: "rgba(107,33,168,0.08)", label: "Exhibition & Cultural" },
  other:                { color: "var(--gs-text-secondary)", bg: "rgba(90,82,71,0.08)", label: "Other" },
};

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:          { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.1)", label: "Pending" },
  pending_approval: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Awaiting Approval" },
  present:          { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Present" },
  absent:           { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)", label: "Absent" },
  excused:          { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)", label: "Excused" },
};

const makeupColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)", label: "Makeup: Pending" },
  allowed:     { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Makeup: Allowed" },
  not_allowed: { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)", label: "Makeup: Not Allowed" },
};

export default async function VolunteerWorkshopsPage() {
  // eslint-disable-next-line react-hooks/purity -- server component, re-executes fresh per request; not a re-render concern
  const now = Date.now();
  const [workshops, myAttendance] = await Promise.all([
    getUpcomingWorkshops(),
    getMyWorkshopAttendance(),
  ]);

  const attendanceMap = new Map(myAttendance.map(a => [a.workshop_id, a]));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const totalCount = workshops.length;
  const upcomingCount = workshops.filter(w => new Date(w.workshop_date) >= today && w.status !== "cancelled").length;
  const attendedCount = myAttendance.filter(a => a.attendance_status === "present").length;
  const missedCount = myAttendance.filter(a => a.attendance_status === "absent" || a.attendance_status === "excused").length;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Workshops</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Training schedule and your attendance</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Workshops" value={totalCount} icon={<GraduationCap size={20} />} accent="indigo" />
          <StatCard label="Upcoming" value={upcomingCount} icon={<CalendarClock size={20} />} accent="sky" />
          <StatCard label="Attended" value={attendedCount} icon={<CheckCircle2 size={20} />} accent="emerald" />
          <StatCard label="Missed" value={missedCount} icon={<XCircle size={20} />} accent="rose" />
        </div>

        <div className="space-y-3">
          {workshops.length === 0 && (
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No workshops scheduled yet.</p>
            </div>
          )}
          {workshops.map(w => {
            const t = typeColors[w.workshop_type] ?? typeColors.other;
            const a = attendanceMap.get(w.id);
            const status = a?.attendance_status ?? "pending";
            const sc = statusColors[status] ?? statusColors.pending;
            const awaitingResponse = status === "pending";
            const workshopDateTime = new Date(w.workshop_time ? `${w.workshop_date}T${w.workshop_time}` : `${w.workshop_date}T23:59:59`);
            const isPast = workshopDateTime.getTime() < now;
            return (
              <div key={w.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
                <div className="flex items-start gap-4">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap size={18} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{w.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: t.color, background: t.bg }}>{t.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: sc.color, background: sc.bg }}>{sc.label}</span>
                      {a?.makeup_decision && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: makeupColors[a.makeup_decision]?.color, background: makeupColors[a.makeup_decision]?.bg }}>
                          {makeupColors[a.makeup_decision]?.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      {new Date(w.workshop_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                      {w.workshop_time ? ` · ${w.workshop_time}` : ""}
                      {w.hall_location ? ` · ${w.hall_location}` : ""}
                      {w.trainer?.name || w.trainer_name ? ` · Trainer: ${w.trainer?.name ?? w.trainer_name}` : ""}
                    </div>
                    {a?.missed_summary && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Your summary: </span>{a.missed_summary}
                      </p>
                    )}
                    {awaitingResponse && (
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
                        <AttendedButton workshopId={w.id} isPast={isPast} />
                        <MissedSummaryForm workshopId={w.id} isPast={isPast} />
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
