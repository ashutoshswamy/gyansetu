import { getAllTourReports } from "@/actions/tour-reports";
import { FileBarChart } from "lucide-react";
import { ApproveReportButton } from "./approve-button";

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(155,145,136,0.10)" },
  submitted: { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:  { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
};

const OBSERVATION_FIELDS: { key: string; label: string }[] = [
  { key: "unique_features", label: "Unique Features of the Region" },
  { key: "best_practices", label: "Best Practices Observed" },
  { key: "cultural_observations", label: "Cultural Observations" },
  { key: "challenges_faced", label: "Challenges Faced During the Visit" },
  { key: "suggestions_future_teams", label: "Suggestions for Future Teams" },
  { key: "important_contacts", label: "Important Local Contacts or Resources" },
  { key: "places_worth_visiting", label: "Places Worth Visiting" },
];

const LOGISTICS_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  food: "Food",
  local_transport: "Local Transport",
  coordination_communication: "Coordination & Communication",
  safety_security: "Safety & Security",
  overall_experience: "Overall Experience",
};

export default async function AdminTourReportsPage() {
  const reports = await getAllTourReports();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tour Reports</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{reports.length} location reports</p>
        </div>

        <div className="space-y-3">
          {reports.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <FileBarChart className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 15, color: "#5A5247" }}>No tour reports submitted yet.</p>
            </div>
          )}
          {reports.map((r) => {
            const s = statusColors[r.status] ?? statusColors.draft;
            const hosts = (r.hosts ?? []) as { organisation?: string; contact_person_name?: string; designation?: string; mobile_number?: string; state?: string; district?: string; block_taluk?: string; village_city?: string }[];
            const scores = (r.logistics_scores ?? {}) as Record<string, number | undefined>;
            return (
              <div key={r.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{r.location_name}</span>
                      <span style={{ fontSize: 12, color: "#9B9188" }}>{r.tour?.title ?? "Unknown tour"}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {r.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                      {r.group?.name ?? "No group"} · Submitted by {r.submitter?.name ?? "Unknown"} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {r.status === "submitted" && <ApproveReportButton id={r.id} />}
                </div>

                {hosts.length > 0 && (
                  <div className="mt-3">
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 4 }}>Local Organisations & Hosts</p>
                    <div className="space-y-1">
                      {hosts.map((h, i) => (
                        <p key={i} style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                          {h.organisation || "-"} · {h.contact_person_name || "-"} ({h.designation || "-"}) · {h.mobile_number || "-"} · {[h.village_city, h.block_taluk, h.district, h.state].filter(Boolean).join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(scores).length > 0 && (
                  <div className="mt-3">
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 4 }}>Logistics Rating</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(scores).filter(([, v]) => v).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 12, color: "#5A5247" }}>{LOGISTICS_LABELS[k] ?? k}: <strong>{v}/10</strong></span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mt-3">
                  {OBSERVATION_FIELDS.map(f => {
                    const val = (r as unknown as Record<string, string | undefined>)[f.key];
                    if (!val) return null;
                    return (
                      <div key={f.key}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{val}</p>
                      </div>
                    );
                  })}

                  {r.overall_recommendation && (
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "#9B9188" }}>Recommendation: </span>{r.overall_recommendation}
                    </p>
                  )}
                  {r.suitable_residential_camps !== undefined && r.suitable_residential_camps !== null && (
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "#9B9188" }}>Suitable for Residential Camps: </span>{r.suitable_residential_camps ? "Yes" : "No"}
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
                  {r.report_file_url && (
                    <a href={r.report_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", display: "inline-block" }}>
                      View report file
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
