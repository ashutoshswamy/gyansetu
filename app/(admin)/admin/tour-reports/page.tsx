import { getAllTourReports } from "@/actions/tour-reports";
import { FileBarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveReportButton } from "./approve-button";
import { TOUR_REPORT_OBSERVATION_FIELDS as OBSERVATION_FIELDS, TOUR_REPORT_LOGISTICS_LABELS as LOGISTICS_LABELS } from "@/lib/report-field-labels";
import { formatDate } from "@/lib/format-date";

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.10)" },
  submitted: { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  approved:  { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
};

export default async function AdminTourReportsPage() {
  const reports = await getAllTourReports();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Tour Reports</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{reports.length} location reports</p>
        </div>

        <div className="space-y-3">
          {reports.length === 0 && (
            <Card>
              <CardContent className="text-center pt-12 pb-12">
                <FileBarChart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
                <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No tour reports submitted yet.</p>
              </CardContent>
            </Card>
          )}
          {reports.map((r) => {
            const s = statusColors[r.status] ?? statusColors.draft;
            const hosts = (r.hosts ?? []) as { organisation?: string; contact_person_name?: string; designation?: string; mobile_number?: string; state?: string; district?: string; block_taluk?: string; village_city?: string }[];
            const scores = (r.logistics_scores ?? {}) as Record<string, number | undefined>;
            return (
              <Card key={r.id}>
                <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{r.location_name}</span>
                      <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>{r.tour?.title ?? "Unknown tour"}</span>
                      <Badge style={{ color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {r.status}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                      {r.group?.name ?? "No group"} · Submitted by {r.submitter?.name ?? "Unknown"} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  {r.status === "submitted" && <ApproveReportButton id={r.id} />}
                </div>

                {hosts.length > 0 && (
                  <div className="mt-3">
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>Local Organisations & Hosts</p>
                    <div className="space-y-1">
                      {hosts.map((h, i) => (
                        <p key={i} style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                          {h.organisation || "-"} · {h.contact_person_name || "-"} ({h.designation || "-"}) · {h.mobile_number || "-"} · {[h.village_city, h.block_taluk, h.district, h.state].filter(Boolean).join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(scores).length > 0 && (
                  <div className="mt-3">
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>Logistics Rating</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(scores).filter(([, v]) => v).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 12, color: "var(--gs-text-secondary)" }}>{LOGISTICS_LABELS[k] ?? k}: <strong>{v}/10</strong></span>
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
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{val}</p>
                      </div>
                    );
                  })}

                  {r.overall_recommendation && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Recommendation: </span>{r.overall_recommendation}
                    </p>
                  )}
                  {r.suitable_residential_camps !== undefined && r.suitable_residential_camps !== null && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Suitable for Residential Camps: </span>{r.suitable_residential_camps ? "Yes" : "No"}
                    </p>
                  )}
                  {r.follow_up_required !== undefined && r.follow_up_required !== null && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Follow-up Required: </span>{r.follow_up_required ? "Yes" : "No"}
                    </p>
                  )}
                  {r.additional_remarks && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 2 }}>Additional Remarks</p>
                      <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{r.additional_remarks}</p>
                    </div>
                  )}
                  {r.report_file_url && (
                    <a href={r.report_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--gs-accent)", display: "inline-block" }}>
                      View report file
                    </a>
                  )}
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
