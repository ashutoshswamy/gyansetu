import { getAllTourReports } from "@/actions/tour-reports";
import { FileBarChart } from "lucide-react";
import { ApproveReportButton } from "./approve-button";

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(155,145,136,0.10)" },
  submitted: { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:  { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
};

export default async function AdminTourReportsPage() {
  const reports = await getAllTourReports();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tour Reports</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{reports.length} final tour reports</p>
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
            return (
              <div key={r.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{r.tour?.title ?? "Unknown tour"}</span>
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
                <div className="space-y-2 mt-3">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Summary</p>
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{r.summary}</p>
                  </div>
                  {r.highlights && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Highlights</p>
                      <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{r.highlights}</p>
                    </div>
                  )}
                  {r.challenges && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Challenges</p>
                      <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{r.challenges}</p>
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
