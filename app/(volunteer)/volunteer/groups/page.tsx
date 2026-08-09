import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { Users, MapPin, Star, Home, Package } from "lucide-react";
import type { TourGroupMember, TourGroup } from "@/types";
import { getLocalHostForMyGroup } from "@/actions/local-hosts";
import { getKitAssignmentForMyGroup, getKitChecklistForGroup } from "@/actions/kits";
import { KitChecklist } from "@/components/features/kits/kit-checklist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  group_leader: "Group Leader",
  project_member: "Project Member",
};

type MembershipRow = TourGroupMember & {
  tour_groups?: (TourGroup & {
    tours?: { id: string; title: string; destination: string; start_date: string } | null;
    users?: { id: string; name: string; email: string } | null;
  }) | null;
};

async function GroupCard({ m }: { m: MembershipRow }) {
  const g = m.tour_groups;
  const [localHost, kitAssignment, kitChecklist] = g?.id
    ? await Promise.all([getLocalHostForMyGroup(g.id), getKitAssignmentForMyGroup(g.id), getKitChecklistForGroup(g.id)])
    : [null, null, []];

  return (
    <Card>
<CardContent>
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>{g?.name}</h2>
          <p style={{ fontSize: 13, color: "var(--gs-muted)", margin: 0 }}>{g?.tours?.title} · {g?.tours?.destination}</p>
        </div>
        {g?.state_allocated && (
          <div style={{ background: "rgba(var(--gs-success-rgb), 0.08)", padding: "8px 14px", borderRadius: 8, textAlign: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--gs-success)" }}>
              <MapPin size={13} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{g.state_allocated}</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>State Allocated</p>
          </div>
        )}
      </div>

      {m.role_in_group && (
        <div style={{ fontSize: 13, color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.06)", padding: "6px 12px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>
          Your role: <strong>{ROLE_LABELS[m.role_in_group] ?? m.role_in_group}</strong>
        </div>
      )}

      {g?.users && (
        <div className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>
          <Star size={13} style={{ color: "var(--gs-warning)" }} />
          <span>Mentor: <strong>{g.users.name}</strong> ({g.users.email})</span>
        </div>
      )}

      {g?.notes && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--gs-card)", borderRadius: 6, fontSize: 13, color: "var(--gs-text-secondary)" }}>
          {g.notes}
        </div>
      )}

      {(localHost || kitAssignment) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          {localHost && (
            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
              <div className="flex items-center gap-2 mb-2">
                <Home size={13} style={{ color: "var(--gs-accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)" }}>Local Host</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 2px" }}>{localHost.name}</p>
              <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: 0 }}>
                {[localHost.phone, localHost.email].filter(Boolean).join(" · ")}
              </p>
              {localHost.address && <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "4px 0 0" }}>{localHost.address}</p>}
            </div>
          )}
          {kitAssignment && (
            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
              <div className="flex items-center gap-2 mb-2">
                <Package size={13} style={{ color: "var(--gs-accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)" }}>Kit Status</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>{kitAssignment.school_count} schools</p>
              <div className="flex gap-2">
                <Badge style={{color: kitAssignment.packed ? "var(--gs-success)" : "var(--gs-muted)", background: kitAssignment.packed ? "rgba(var(--gs-success-rgb), 0.08)" : "var(--gs-card)"}}>
                  {kitAssignment.packed ? "Packed" : "Not Packed"}
                </Badge>
                <Badge style={{color: kitAssignment.distributed ? "var(--gs-accent)" : "var(--gs-muted)", background: kitAssignment.distributed ? "rgba(var(--gs-accent-rgb), 0.08)" : "var(--gs-card)"}}>
                  {kitAssignment.distributed ? "Distributed" : "Not Distributed"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {kitAssignment && kitChecklist.length > 0 && g?.id && (
        <div style={{ marginTop: 12 }}>
          <KitChecklist groupId={g.id} items={kitChecklist} />
        </div>
      )}
    </CardContent>
</Card>
  );
}

export default async function VolunteerGroupsPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: currentUser } = await db.from("users").select("id").eq("clerk_id", userId!).single();

  const { data: myMembership } = await db
    .from("tour_group_members")
    .select("*, tour_groups(*, tours(id, title, destination, start_date), users!tour_groups_mentor_id_fkey(id, name, email))")
    .eq("user_id", currentUser?.id ?? "");

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>My Groups</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Your team assignments and state allocations</p>
        </div>

        {(myMembership ?? []).length === 0 ? (
          <Card>
<CardContent className="text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)", marginBottom: 4 }}>Not assigned to any group yet.</p>
            <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>An admin will assign you to a tour group.</p>
          </CardContent>
</Card>
        ) : (
          <div className="space-y-4">
            {(myMembership ?? []).map((m: MembershipRow) => (
              <GroupCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
