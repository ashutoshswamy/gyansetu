import { getAllSchoolReports } from "@/actions/school-reports";
import { School } from "lucide-react";

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(155,145,136,0.10)" },
  submitted: { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
};

interface SchoolSession {
  standard?: string;
  division?: string;
  num_students?: number;
  theme_topic?: string;
  duration_minutes?: number;
  language_used?: string;
  combined_session?: boolean;
}

interface SchoolReportRow {
  id: string;
  created_at: string;
  status: string;
  school_name: string;
  school_type?: string;
  location_category?: string;
  medium_of_instruction?: string;
  street_area?: string;
  village_town?: string;
  taluka_tehsil?: string;
  district?: string;
  state?: string;
  pincode?: string;
  principal_name?: string;
  principal_mobile?: string;
  coordinator_name?: string;
  coordinator_mobile?: string;
  visit_date?: string;
  volunteers_present_count?: number;
  volunteer_names?: string[];
  sessions?: SchoolSession[];
  student_response?: string;
  what_went_well?: string;
  challenges_faced?: string;
  suggestions_improvement?: string;
  memorable_moment?: string;
  overall_feedback?: string;
  overall_rating?: string;
  follow_up_required?: boolean;
  additional_remarks?: string;
  group?: { id: string; name: string; tour_id: string; tours?: { id: string; title: string } } | null;
  submitter?: { id: string; name: string } | null;
}

const NARRATIVE_FIELDS: { key: keyof SchoolReportRow; label: string }[] = [
  { key: "student_response", label: "Student Response" },
  { key: "what_went_well", label: "What Went Well" },
  { key: "challenges_faced", label: "Challenges Faced" },
  { key: "suggestions_improvement", label: "Suggestions for Improvement" },
  { key: "memorable_moment", label: "Memorable Moment" },
  { key: "overall_feedback", label: "Overall Feedback" },
];

export default async function AdminSchoolReportsPage() {
  const reports = (await getAllSchoolReports()) as unknown as SchoolReportRow[];

  const byTour: Record<string, { title: string; groups: Record<string, { name: string; reports: SchoolReportRow[] }> }> = {};
  for (const r of reports) {
    const tourKey = r.group?.tour_id ?? "unassigned";
    const tourTitle = r.group?.tours?.title ?? "Unassigned Tour";
    const groupKey = r.group?.id ?? "unassigned";
    const groupName = r.group?.name ?? "Unassigned Group";
    if (!byTour[tourKey]) byTour[tourKey] = { title: tourTitle, groups: {} };
    if (!byTour[tourKey].groups[groupKey]) byTour[tourKey].groups[groupKey] = { name: groupName, reports: [] };
    byTour[tourKey].groups[groupKey].reports.push(r);
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>School Reports</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{reports.length} school visit reports</p>
        </div>

        {reports.length === 0 && (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <School className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No school reports submitted yet.</p>
          </div>
        )}

        {Object.entries(byTour).map(([tourId, tour]) => (
          <div key={tourId} className="mb-10">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#19140F", marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid #E4DFD1" }}>
              {tour.title}
            </h2>
            {Object.entries(tour.groups).map(([groupId, group]) => (
              <div key={groupId} className="mb-6">
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#5A5247", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {group.name} ({group.reports.length})
                </h3>
                <div className="space-y-3">
                  {group.reports.map(r => {
                    const s = statusColors[r.status] ?? statusColors.draft;
                    const sessions = r.sessions ?? [];
                    return (
                      <div key={r.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{r.school_name}</span>
                              {r.school_type && (
                                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                                  {r.school_type}
                                </span>
                              )}
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                                {r.status}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                              {[r.village_town, r.taluka_tehsil, r.district, r.state].filter(Boolean).join(", ")}
                              {r.pincode ? ` - ${r.pincode}` : ""}
                              {" · "}Submitted by {r.submitter?.name ?? "Unknown"} · {new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-3" style={{ fontSize: 12, color: "#5A5247" }}>
                          {r.visit_date && <span>Visit Date: <strong>{new Date(r.visit_date).toLocaleDateString()}</strong></span>}
                          {r.location_category && <span>Location: <strong>{r.location_category}</strong></span>}
                          {r.medium_of_instruction && <span>Medium: <strong>{r.medium_of_instruction}</strong></span>}
                          {r.volunteers_present_count != null && <span>Volunteers Present: <strong>{r.volunteers_present_count}</strong></span>}
                        </div>

                        {(r.principal_name || r.coordinator_name) && (
                          <div className="flex flex-wrap gap-4 mb-3" style={{ fontSize: 12, color: "#5A5247" }}>
                            {r.principal_name && <span>Principal: <strong>{r.principal_name}</strong>{r.principal_mobile ? ` (${r.principal_mobile})` : ""}</span>}
                            {r.coordinator_name && <span>Coordinator: <strong>{r.coordinator_name}</strong>{r.coordinator_mobile ? ` (${r.coordinator_mobile})` : ""}</span>}
                          </div>
                        )}

                        {sessions.length > 0 && (
                          <div className="mb-3">
                            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 4 }}>Sessions Conducted</p>
                            <div className="space-y-1">
                              {sessions.map((sess, i) => (
                                <p key={i} style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                                  {[sess.standard, sess.division].filter(Boolean).join("-") || "Class -"} · {sess.theme_topic || "-"} · {sess.num_students ?? "-"} students · {sess.duration_minutes ?? "-"} min{sess.language_used ? ` · ${sess.language_used}` : ""}{sess.combined_session ? " · Combined" : ""}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.volunteer_names && r.volunteer_names.length > 0 && (
                          <p style={{ fontSize: 12, color: "#5A5247", margin: "0 0 12px" }}>
                            <span style={{ fontWeight: 600, color: "#9B9188" }}>Volunteers: </span>{r.volunteer_names.join(", ")}
                          </p>
                        )}

                        <div className="space-y-2">
                          {NARRATIVE_FIELDS.map(f => {
                            const val = r[f.key] as string | undefined;
                            if (!val) return null;
                            return (
                              <div key={f.key}>
                                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>{f.label}</p>
                                <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{val}</p>
                              </div>
                            );
                          })}

                          {r.overall_rating && (
                            <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                              <span style={{ fontWeight: 600, color: "#9B9188" }}>Overall Rating: </span>{r.overall_rating}
                            </p>
                          )}
                          {r.follow_up_required !== undefined && r.follow_up_required !== null && (
                            <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                              <span style={{ fontWeight: 600, color: "#9B9188" }}>Follow-up Required: </span>{r.follow_up_required ? "Yes" : "No"}
                            </p>
                          )}
                          {r.additional_remarks && (
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Additional Remarks</p>
                              <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{r.additional_remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
