import { createServerClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExportButton } from "@/components/features/export-button";
import { Users, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

const tourStatusStyles: Record<string, { color: string; bg: string }> = {
  open:      { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  closed:    { color: "#9B9188", bg: "rgba(90,82,71,0.08)" },
  completed: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  draft:     { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
};

interface VolunteerAssignment {
  id: string;
  role_description?: string;
  tours?: { id: string; title: string; destination: string; start_date: string; end_date: string; status: string };
}

interface VolunteerRow {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  volunteer_assignments?: VolunteerAssignment[];
}

export default async function AdminVolunteersPage() {
  const db = createServerClient();

  const { data: volunteers } = await db
    .from("users")
    .select("*, volunteer_assignments(id, role_description, tours(id, title, destination, start_date, end_date, status))")
    .eq("role", "volunteer")
    .order("created_at", { ascending: false });

  const exportData = ((volunteers ?? []) as VolunteerRow[]).flatMap((v) => {
    const assignments = v.volunteer_assignments ?? [];
    if (assignments.length === 0) {
      return [{ name: v.name, email: v.email, tour: "-", destination: "-", role: "-", tour_status: "-" }];
    }
    return assignments.map((a) => ({
      name: v.name,
      email: v.email,
      tour: a.tours?.title ?? "-",
      destination: a.tours?.destination ?? "-",
      role: a.role_description ?? "-",
      tour_status: a.tours?.status ?? "-",
      start_date: a.tours?.start_date ?? "-",
    }));
  });

  const summaryItems = [
    { label: "Total Volunteers", value: volunteers?.length ?? 0 },
    { label: "Assigned to Tours", value: ((volunteers ?? []) as VolunteerRow[]).filter((v) => (v.volunteer_assignments?.length ?? 0) > 0).length },
    { label: "Unassigned", value: ((volunteers ?? []) as VolunteerRow[]).filter((v) => (v.volunteer_assignments?.length ?? 0) === 0).length },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Volunteers</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {volunteers?.length ?? 0} volunteers · tour assignments and roles
            </p>
          </div>
          <ExportButton data={exportData} filename="volunteers.csv" label="Export CSV" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid #E4DFD1", background: "white" }}>
          {summaryItems.map((item, idx) => (
            <div key={item.label} className="py-4 px-5" style={{ borderRight: idx < summaryItems.length - 1 ? "1px solid #E4DFD1" : undefined }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#4A55BE", fontFamily: "var(--font-geist-mono), monospace" }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {(volunteers ?? []).length === 0 && (
            <div className="py-16 text-center rounded-xl" style={{ background: "white", border: "1px solid #E4DFD1" }}>
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 14, color: "#9B9188" }}>No volunteers yet.</p>
              <p style={{ fontSize: 12, marginTop: 4, color: "#C8C4BC" }}>Users are promoted to volunteer after passing an eligibility test.</p>
            </div>
          )}

          {((volunteers ?? []) as VolunteerRow[]).map((v) => {
            const assignments = v.volunteer_assignments ?? [];
            return (
              <div key={v.id} className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
                <div className="flex items-center gap-4 p-4">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={v.avatar_url} />
                    <AvatarFallback className="text-sm font-semibold" style={{ background: "rgba(74,85,190,0.1)", color: "#4A55BE" }}>
                      {v.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{v.name}</p>
                    <p style={{ fontSize: 12, color: "#9B9188" }}>{v.email}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0" style={{ fontSize: 12 }}>
                    <div className="text-center">
                      <p style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, color: "#19140F", fontFamily: "var(--font-geist-mono), monospace" }}>{assignments.length}</p>
                      <p style={{ marginTop: 2, color: "#9B9188" }}>{assignments.length === 1 ? "tour" : "tours"}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)" }}>
                      Volunteer
                    </span>
                    <Link href={`/admin/volunteers/${v.id}`}>
                      <button style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}>
                        Profile
                      </button>
                    </Link>
                  </div>
                </div>

                {assignments.length > 0 && (
                  <div className="px-4 pb-3" style={{ borderTop: "1px solid #E4DFD1" }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B9188", paddingTop: 12, paddingBottom: 8 }}>
                      Tour Assignments
                    </p>
                    <div className="space-y-1.5">
                      {assignments.map((a) => {
                        const s = tourStatusStyles[a.tours?.status ?? "draft"] ?? tourStatusStyles.draft;
                        return (
                          <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded" style={{ background: "#F3F0E8" }}>
                            <div className="min-w-0">
                              <p style={{ fontSize: 12, fontWeight: 500, color: "#19140F" }} className="truncate">{a.tours?.title ?? "-"}</p>
                              <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: 11, color: "#9B9188" }}>
                                {a.tours?.destination && (
                                  <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{a.tours.destination}</span>
                                )}
                                {a.tours?.start_date && (
                                  <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{new Date(a.tours.start_date).toLocaleDateString()}</span>
                                )}
                                {a.role_description && <span>· {a.role_description}</span>}
                              </div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize", flexShrink: 0, marginLeft: 16 }}>
                              {a.tours?.status ?? "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignments.length === 0 && (
                  <div className="px-4 pb-3 pt-2" style={{ borderTop: "1px solid #E4DFD1" }}>
                    <p style={{ fontSize: 12, color: "#C8C4BC" }}>No tour assignments yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
