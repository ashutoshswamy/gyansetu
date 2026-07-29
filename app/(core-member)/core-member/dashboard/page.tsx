import { requireCoreMemberUser } from "@/lib/clerk/action-auth";
import { getMyCoreMemberAssignments } from "@/actions/groups";
import { Users, MapPin, Calendar, UsersRound } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  group_leader: "Group Leader",
  project_member: "Project Member",
  group_core_member: "Core Member",
};

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)",  label: "Open" },
  closed:    { color: "#9B9188", bg: "rgba(90,82,71,0.08)",  label: "Closed" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)", label: "Completed" },
  draft:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)", label: "Draft" },
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
    } | null;
    tour_group_members?: Member[];
  } | null;
}

export default async function CoreMemberDashboardPage() {
  await requireCoreMemberUser();
  const assignments = (await getMyCoreMemberAssignments()) as Assignment[];

  const current = assignments.filter(a => ["open", "draft"].includes(a.tour_groups?.tours?.status ?? ""));
  const history = assignments.filter(a => ["closed", "completed"].includes(a.tour_groups?.tours?.status ?? ""));

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Core Member Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Your current visit and past group assignments</p>
        </div>

        {assignments.length === 0 ? (
          <div className="py-20 text-center rounded-xl" style={{ background: "white", border: "1px solid #E4DFD1" }}>
            <UsersRound className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 14, color: "#9B9188" }}>Not assigned as core member of any group yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {current.length > 0 && (
              <section>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9188", marginBottom: 12 }}>Current</p>
                <div className="space-y-5">
                  {current.map(a => <CurrentGroupCard key={a.id} assignment={a} />)}
                </div>
              </section>
            )}

            {history.length > 0 && (
              <section>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9188", marginBottom: 12 }}>History</p>
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
    <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid #E4DFD1" }}>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="min-w-0">
          <p style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 2 }}>{group?.name}</p>
          {tour?.title && <p style={{ fontSize: 13, color: "#5A5247" }}>{tour.title}</p>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: s.color, background: s.bg, flexShrink: 0 }}>{s.label}</span>
      </div>

      <div className="flex flex-wrap gap-4 mb-4" style={{ fontSize: 12, color: "#9B9188" }}>
        {(group?.state_allocated || tour?.destination) && (
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{group?.state_allocated || tour?.destination}</span>
        )}
        {tour?.start_date && (
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(tour.start_date).toLocaleDateString()} → {tour.end_date ? new Date(tour.end_date).toLocaleDateString() : "TBD"}</span>
        )}
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{members.length} {members.length === 1 ? "volunteer" : "volunteers"}</span>
      </div>

      {members.length > 0 && (
        <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B9188", marginBottom: 8 }}>Volunteers</p>
          <div className="space-y-1.5">
            {members.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#F3F0E8" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }}>{m.users?.name}</span>
                  <span style={{ fontSize: 12, color: "#9B9188", marginLeft: 8 }}>{m.users?.email}</span>
                </div>
                {m.role_in_group && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#4A55BE", padding: "1px 6px", background: "rgba(74,85,190,0.08)", borderRadius: 4 }}>
                    {ROLE_LABELS[m.role_in_group] ?? m.role_in_group}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ assignment }: { assignment: Assignment }) {
  const group = assignment.tour_groups;
  const tour = group?.tours;
  const s = statusStyles[tour?.status ?? "completed"] ?? statusStyles.completed;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl p-4 flex-wrap" style={{ background: "white", border: "1px solid #E4DFD1" }}>
      <div className="min-w-0">
        <p style={{ fontSize: 14, fontWeight: 600, color: "#19140F", marginBottom: 2 }}>{group?.name}</p>
        <p style={{ fontSize: 12, color: "#9B9188" }}>
          {tour?.title}{group?.state_allocated ? ` · ${group.state_allocated}` : ""}
          {tour?.start_date && ` · ${new Date(tour.start_date).toLocaleDateString()}`}
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, color: s.color, background: s.bg, flexShrink: 0 }}>{s.label}</span>
    </div>
  );
}
