import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { Users, MapPin, Star } from "lucide-react";

export default async function VolunteerGroupsPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: currentUser } = await db.from("users").select("id").eq("clerk_id", userId!).single();

  const { data: myMembership } = await db
    .from("tour_group_members")
    .select("*, tour_groups(*, tours(id, title, destination, start_date), users!tour_groups_mentor_id_fkey(id, name, email))")
    .eq("user_id", currentUser?.id ?? "");

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My Groups</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Your team assignments and state allocations</p>
        </div>

        {(myMembership ?? []).length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247", marginBottom: 4 }}>Not assigned to any group yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>An admin will assign you to a tour group.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(myMembership ?? []).map((m: any) => {
              const g = m.tour_groups;
              return (
                <div key={m.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "20px 24px" }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#19140F", margin: "0 0 4px" }}>{g?.name}</h2>
                      <p style={{ fontSize: 13, color: "#9B9188", margin: 0 }}>{g?.tours?.title} · {g?.tours?.destination}</p>
                    </div>
                    {g?.state_allocated && (
                      <div style={{ background: "rgba(42,94,58,0.08)", padding: "8px 14px", borderRadius: 8, textAlign: "center", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2A5E3A" }}>
                          <MapPin size={13} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{g.state_allocated}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#9B9188", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>State Allocated</p>
                      </div>
                    )}
                  </div>

                  {m.role_in_group && (
                    <div style={{ fontSize: 13, color: "#4A55BE", background: "rgba(74,85,190,0.06)", padding: "6px 12px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>
                      Your role: <strong>{m.role_in_group}</strong>
                    </div>
                  )}

                  {g?.users && (
                    <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#5A5247" }}>
                      <Star size={13} style={{ color: "#F5A520" }} />
                      <span>Mentor: <strong>{g.users.name}</strong> ({g.users.email})</span>
                    </div>
                  )}

                  {g?.notes && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#F3F0E8", borderRadius: 6, fontSize: 13, color: "#5A5247" }}>
                      {g.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
