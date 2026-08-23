import { requireCoreMemberUser } from "@/lib/clerk/action-auth";
import { getMyCoreMemberAssignments } from "@/actions/groups";
import { Users, MapPin, Calendar, UsersRound } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  group_leader: "Group Leader",
  project_member: "Project Member",
  group_core_member: "Core Member",
};

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  open:      { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)",  label: "Open" },
  closed:    { color: "var(--gs-muted)", bg: "rgba(90,82,71,0.08)",  label: "Closed" },
  completed: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)", label: "Completed" },
  draft:     { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)", label: "Draft" },
};

interface Member {
  id: string;
  user_id: string;
  role_in_group?: string;
  users?: { id: string; name: string; email: string };
}

interface Assignment {
  id: string;
  group_id: string;
  tour_groups?: {
    id: string;
    name: string;
    state_allocated?: string;
    tours?: {
      id: string;
      title: string;
      destination?: string;
      start_date?: string;
      end_date?: string;
      status: string;
      participant_visible: boolean;
    } | null;
    tour_group_members?: Member[];
  } | null;
}

export default async function CoreMemberDashboardPage() {
  await requireCoreMemberUser();
  const assignments = (await getMyCoreMemberAssignments()) as Assignment[];

  const current = assignments.filter(a =>
    ["open", "draft"].includes(a.tour_groups?.tours?.status ?? "") && a.tour_groups?.tours?.participant_visible !== false
  );
  const history = assignments.filter(a => ["closed", "completed"].includes(a.tour_groups?.tours?.status ?? ""));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Core Member Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Your current visit and past group assignments</p>
        </div>

        {assignments.length === 0 ? (
          <Card>
<CardContent>
            <UsersRound className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>Not assigned as core member of any group yet.</p>
          </CardContent>
</Card>
        ) : (
          <div className="space-y-10">
            {current.length > 0 ? (
              <section>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 12 }}>Current</p>
                <div className="space-y-5">
                  {current.map(a => <CurrentGroupCard key={a.id} assignment={a} />)}
                </div>
              </section>
            ) : (
              <Card>
<CardContent>
                <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>You are not currently part of any tour.</p>
              </CardContent>
</Card>
            )}

            {history.length > 0 && (
              <section>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 12 }}>History</p>
                <div className="space-y-3">
                  {history.map(a => <HistoryRow key={a.id} assignment={a} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentGroupCard({ assignment }: { assignment: Assignment }) {
  const group = assignment.tour_groups;
  const tour = group?.tours;
  const members = group?.tour_group_members ?? [];
  const s = statusStyles[tour?.status ?? "draft"] ?? statusStyles.draft;

  return (
    <Card>
<CardContent>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="min-w-0">
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>{group?.name}</p>
          {tour?.title && <p style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>{tour.title}</p>}
        </div>
        <Badge style={{color: s.color, background: s.bg, flexShrink: 0}}>{s.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-4 mb-4" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
        {(group?.state_allocated || tour?.destination) && (
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{group?.state_allocated || tour?.destination}</span>
        )}
        {tour?.start_date && (
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(tour.start_date)} → {tour.end_date ? formatDate(tour.end_date) : "TBD"}</span>
        )}
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{members.length} {members.length === 1 ? "volunteer" : "volunteers"}</span>
      </div>

      {members.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-muted)", marginBottom: 8 }}>Volunteers</p>
          <div className="space-y-1.5">
            {members.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "var(--gs-card)" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{m.users?.name}</span>
                  <span style={{ fontSize: 12, color: "var(--gs-muted)", marginLeft: 8 }}>{m.users?.email}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.role_in_group && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-accent)", padding: "1px 6px", background: "rgba(var(--gs-accent-rgb), 0.08)", borderRadius: 4 }}>
                      {ROLE_LABELS[m.role_in_group] ?? m.role_in_group}
                    </span>
                  )}
                  {m.users?.id && (
                    <Link
                      href={`/core-member/volunteer/${m.users.id}?group=${assignment.group_id}`}
                      style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-text-secondary)", padding: "3px 8px", border: "1.5px solid var(--border)", borderRadius: 4, textDecoration: "none" }}
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
</Card>
  );
}

function HistoryRow({ assignment }: { assignment: Assignment }) {
  const group = assignment.tour_groups;
  const tour = group?.tours;
  const s = statusStyles[tour?.status ?? "completed"] ?? statusStyles.completed;

  return (
    <Card>
<CardContent>
      <div className="min-w-0">
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>{group?.name}</p>
        <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>
          {tour?.title}{group?.state_allocated ? ` · ${group.state_allocated}` : ""}
          {tour?.start_date && ` · ${formatDate(tour.start_date)}`}
        </p>
      </div>
      <Badge style={{color: s.color, background: s.bg, flexShrink: 0}}>{s.label}</Badge>
    </CardContent>
</Card>
  );
}
