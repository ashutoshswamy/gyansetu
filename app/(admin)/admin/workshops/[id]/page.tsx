import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getWorkshopAttendees } from "@/actions/workshops";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { MarkAttendanceButtons, MakeupDecisionButtons } from "../attendance-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeColors: Record<string, { color: string; bg: string; label: string }> = {
  science:            { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Science" },
  mathematics:        { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Mathematics" },
  exhibition_country: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)", label: "Exhibition- Know our Country" },
  cultural_survey:    { color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)", label: "Cultural and Survey" },
  other:              { color: "var(--gs-text-secondary)", bg: "rgba(90,82,71,0.08)", label: "Other" },
};

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:          { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.1)", label: "Pending" },
  pending_approval: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Awaiting Approval" },
  present:          { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Present" },
  absent:           { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)", label: "Absent" },
  excused:          { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)", label: "Excused" },
};

const makeupColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.1)", label: "Pending" },
  allowed:     { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)", label: "Allowed" },
  not_allowed: { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)", label: "Not Allowed" },
};

export default async function AdminWorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const [{ data: workshop }, attendees, volunteersRes] = await Promise.all([
    db.from("workshops").select("*, trainer:users!workshops_trainer_id_fkey(id, name, email), workshop_groups(group:tour_groups(id, name))").eq("id", id).single(),
    getWorkshopAttendees(id),
    db.from("users").select("id, name, email").eq("role", "volunteer").order("name"),
  ]);

  if (!workshop) {
    return (
      <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
        <p style={{ color: "var(--gs-text-secondary)" }}>Workshop not found.</p>
      </div>
    );
  }

  const t = typeColors[workshop.workshop_type] ?? typeColors.other;
  const attendeeMap = new Map(attendees.map(a => [a.volunteer_id, a]));
  const allVolunteers = volunteersRes.data ?? [];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/workshops" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--gs-text-secondary)", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Workshops
        </Link>

        <Card>
<CardContent>
          <div className="flex items-start gap-4">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GraduationCap size={22} style={{ color: t.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{workshop.title}</h1>
                <Badge style={{color: t.color, background: t.bg}}>{t.label}</Badge>
                <Badge style={{color: "var(--gs-text-secondary)", background: "var(--background)", border: "1px solid var(--border)", textTransform: "capitalize"}}>{workshop.status}</Badge>
              </div>
              <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "4px 0 0" }}>
                {new Date(workshop.workshop_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                {workshop.workshop_time ? ` · ${workshop.workshop_time}` : ""}
                {workshop.hall_location ? ` · ${workshop.hall_location}` : ""}
              </p>
              <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "2px 0 0" }}>
                Trainer: {workshop.trainer_name ?? "No trainer assigned"}
                {" · "}
                Kit: <span style={{ color: workshop.kit_ready ? "var(--gs-success)" : "var(--gs-muted)", fontWeight: 600 }}>{workshop.kit_ready ? "Ready" : "Not Ready"}</span>
              </p>
              {workshop.workshop_groups?.length > 0 && (
                <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "2px 0 0" }}>
                  Groups: {workshop.workshop_groups.map((wg: { group: { id: string; name: string } }) => wg.group.name).join(", ")}
                </p>
              )}
              {workshop.plan_notes && (
                <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{workshop.plan_notes}</p>
              )}
            </div>
          </div>
        </CardContent>
</Card>

        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: "24px 0 12px" }}>Attendance</h2>
        <div className="space-y-3">
          {allVolunteers.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No volunteers found.</p>
          )}
          {allVolunteers.map((v: { id: string; name: string; email: string }) => {
            const a = attendeeMap.get(v.id);
            const status = a?.attendance_status ?? "pending";
            const sc = statusColors[status] ?? statusColors.pending;
            return (
              <Card key={v.id}>
<CardContent>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{v.name}</span>
                      <Badge style={{color: sc.color, background: sc.bg}}>{sc.label}</Badge>
                      {a?.makeup_decision && (
                        <Badge style={{color: makeupColors[a.makeup_decision]?.color, background: makeupColors[a.makeup_decision]?.bg}}>
                          Makeup: {makeupColors[a.makeup_decision]?.label}
                        </Badge>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>{v.email}</p>
                    {a?.missed_summary && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Missed summary: </span>{a.missed_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <MarkAttendanceButtons workshopId={id} volunteerId={v.id} pendingApproval={status === "pending_approval"} />
                    {a?.missed_summary && a?.makeup_decision === "pending" && (
                      <MakeupDecisionButtons workshopId={id} volunteerId={v.id} />
                    )}
                  </div>
                </div>
              </CardContent>
</Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
