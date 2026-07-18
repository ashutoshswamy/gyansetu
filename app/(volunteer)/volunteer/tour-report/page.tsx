"use client";

import { useState, useEffect } from "react";
import { getMyTourReports, submitTourReport } from "@/actions/tour-reports";
import { FileBarChart } from "lucide-react";
import type { TourReport } from "@/types";

type TourReportRow = TourReport & { tour?: { id: string; title: string } | null };

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(155,145,136,0.10)" },
  submitted: { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:  { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
};

export default function VolunteerTourReportPage() {
  const [reports, setReports] = useState<TourReportRow[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asFinal, setAsFinal] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyTourReports(),
      fetch("/api/tours").then(r => r.json()),
    ]).then(([reportsData, toursData]) => {
      setReports(reportsData);
      setTours(Array.isArray(toursData) ? toursData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const report = await submitTourReport({
        tour_id: fd.get("tour_id") as string,
        summary: fd.get("summary") as string,
        highlights: (fd.get("highlights") as string) || undefined,
        challenges: (fd.get("challenges") as string) || undefined,
        report_file_url: (fd.get("report_file_url") as string) || undefined,
        status: asFinal ? "submitted" : "draft",
      });
      setReports(prev => [report, ...prev]);
      (e.target as HTMLFormElement).reset();
      setAsFinal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit tour report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tour Report</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Final summary of your tour experience</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 20px" }}>Submit Tour Report</h2>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
              <select name="tour_id" required style={inputStyle}>
                <option value="">Select tour...</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Summary <span style={{ color: "#DC2626" }}>*</span></label>
              <textarea name="summary" required rows={4} placeholder="Overall summary of the tour..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Highlights</label>
              <textarea name="highlights" rows={3} placeholder="Key moments and achievements..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Challenges</label>
              <textarea name="challenges" rows={3} placeholder="Difficulties faced and how they were handled..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Report File URL</label>
              <input name="report_file_url" type="text" placeholder="https://..." style={inputStyle} />
            </div>
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#5A5247" }}>
              <input type="checkbox" checked={asFinal} onChange={(e) => setAsFinal(e.target.checked)} />
              Submit as final (otherwise saved as draft)
            </label>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: 16, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Submitting..." : asFinal ? "Submit Final Report" : "Save Draft"}
          </button>
        </form>

        {loading ? (
          <p style={{ color: "#9B9188", fontSize: 14 }}>Loading...</p>
        ) : reports.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <FileBarChart className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No tour reports yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const s = statusColors[r.status] ?? statusColors.draft;
              return (
                <div key={r.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "18px 22px" }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{r.tour?.title ?? "Unknown tour"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 8px" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                  <p style={{ fontSize: 14, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{r.summary}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
