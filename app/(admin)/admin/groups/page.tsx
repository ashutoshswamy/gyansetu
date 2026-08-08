import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, MapPin, Star } from "lucide-react";
import { DeleteGroupButton } from "@/components/features/groups/delete-group-button";
import { Button } from "@/components/ui/button";

interface GroupMember {
  id: string;
  role_in_group?: string;
  users?: { id: string; name: string; email: string };
}

interface GroupRow {
  id: string;
  name: string;
  state_allocated?: string;
  tours?: { id: string; title: string; destination: string };
  tour_group_members?: GroupMember[];
  users?: { id: string; name: string };
}

export default async function AdminGroupsPage() {
  const db = createServerClient();

  const { data: groups } = await db
    .from("tour_groups")
    .select("*, tours(id, title, destination), tour_group_members(id, role_in_group, users(id, name, email)), users!tour_groups_mentor_id_fkey(id, name)")
    .order("created_at", { ascending: false });

  const groupsByTour: Record<string, GroupRow[]> = {};
  for (const g of groups ?? []) {
    const key = g.tours?.title ?? "Unlinked";
    if (!groupsByTour[key]) groupsByTour[key] = [];
    groupsByTour[key].push(g);
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Groups</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
              Team formation and state allocations {(groups ?? []).length} groups total
            </p>
          </div>
          <Link href="/admin/groups/new">
            <Button size="sm">+ New Group</Button>
          </Link>
        </div>

        {Object.keys(groupsByTour).length === 0 && (
          <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
            No groups yet. Create groups to organize volunteers by state.
          </p>
        )}

        {Object.entries(groupsByTour).map(([tourTitle, tourGroups]) => (
          <div key={tourTitle} className="mb-8">
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tourTitle} ({tourGroups.length} groups)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tourGroups.map((group) => (
                <div key={group.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{group.name}</h3>
                      {group.state_allocated && (
                        <div className="flex items-center gap-1 mt-1" style={{ fontSize: 12, color: "var(--gs-success)" }}>
                          <MapPin size={11} />
                          <span>{group.state_allocated}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/groups/${group.id}`}>
                        <Button variant="outline" size="xs">Manage</Button>
                      </Link>
                      <Link href={`/admin/groups/${group.id}/edit`}>
                        <Button variant="outline" size="xs">Edit</Button>
                      </Link>
                      <DeleteGroupButton groupId={group.id} />
                    </div>
                  </div>

                  {group.users && (
                    <div className="flex items-center gap-1 mb-2" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                      <Star size={11} style={{ color: "var(--gs-warning)" }} />
                      <span>Mentor: {group.users.name}</span>
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #F0EDE4", paddingTop: 10, marginTop: 4 }}>
                    <div className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--gs-muted)", marginBottom: 6 }}>
                      <Users size={11} />
                      <span>{group.tour_group_members?.length ?? 0} members</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(group.tour_group_members ?? []).slice(0, 5).map((m) => (
                        <span key={m.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(var(--gs-accent-rgb), 0.07)", color: "var(--gs-accent)" }}>
                          {m.users?.name}
                        </span>
                      ))}
                      {(group.tour_group_members ?? []).length > 5 && (
                        <span style={{ fontSize: 11, color: "var(--gs-muted)" }}>+{(group.tour_group_members ?? []).length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
