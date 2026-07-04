import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, MapPin, Star } from "lucide-react";

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
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Groups</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              Team formation and state allocations {(groups ?? []).length} groups total
            </p>
          </div>
          <Link href="/admin/groups/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Group
            </button>
          </Link>
        </div>

        {Object.keys(groupsByTour).length === 0 && (
          <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
            No groups yet. Create groups to organize volunteers by state.
          </p>
        )}

        {Object.entries(groupsByTour).map(([tourTitle, tourGroups]) => (
          <div key={tourTitle} className="mb-8">
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#5A5247", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tourTitle} ({tourGroups.length} groups)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tourGroups.map((group) => (
                <div key={group.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 18px" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }}>{group.name}</h3>
                      {group.state_allocated && (
                        <div className="flex items-center gap-1 mt-1" style={{ fontSize: 12, color: "#2A5E3A" }}>
                          <MapPin size={11} />
                          <span>{group.state_allocated}</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/groups/${group.id}`}>
                      <button style={{ background: "transparent", color: "#4A55BE", fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 5, border: "1.5px solid rgba(74,85,190,0.28)", cursor: "pointer" }}>
                        Manage
                      </button>
                    </Link>
                  </div>

                  {group.users && (
                    <div className="flex items-center gap-1 mb-2" style={{ fontSize: 12, color: "#9B9188" }}>
                      <Star size={11} style={{ color: "#F5A520" }} />
                      <span>Mentor: {group.users.name}</span>
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #F0EDE4", paddingTop: 10, marginTop: 4 }}>
                    <div className="flex items-center gap-1" style={{ fontSize: 12, color: "#9B9188", marginBottom: 6 }}>
                      <Users size={11} />
                      <span>{group.tour_group_members?.length ?? 0} members</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(group.tour_group_members ?? []).slice(0, 5).map((m) => (
                        <span key={m.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(74,85,190,0.07)", color: "#4A55BE" }}>
                          {m.users?.name}
                        </span>
                      ))}
                      {(group.tour_group_members ?? []).length > 5 && (
                        <span style={{ fontSize: 11, color: "#9B9188" }}>+{(group.tour_group_members ?? []).length - 5} more</span>
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
