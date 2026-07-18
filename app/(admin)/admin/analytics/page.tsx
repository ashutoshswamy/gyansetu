import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { ClipboardList, CheckCircle, Pencil, FileText } from "lucide-react";

export default async function AnalyticsPage() {
  const db = createServerClient();

  const [
    { data: tours },
    { data: applications },
    { data: attempts },
    { data: submissions },
  ] = await Promise.all([
    db.from("tours").select("id, status, title, capacity"),
    db.from("tour_applications").select("tour_id, status, test_score"),
    db.from("test_attempts").select("score, status"),
    db.from("form_submissions").select("id, form_id"),
  ]);

  const avgScore =
    attempts && attempts.length > 0
      ? (
          attempts
            .filter((a) => a.score !== null)
            .reduce((sum, a) => sum + (a.score ?? 0), 0) /
          attempts.filter((a) => a.score !== null).length
        ).toFixed(1)
      : "N/A";

  const selectedCount = (applications ?? []).filter((a) => a.status === "selected").length;
  const totalApplied = (applications ?? []).length;
  const selectionRate = totalApplied > 0 ? ((selectedCount / totalApplied) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Platform-wide statistics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Applications" value={totalApplied} icon={<ClipboardList size={18} />} />
          <StatCard label="Selected" value={selectedCount} sub={`${selectionRate}% rate`} icon={<CheckCircle size={18} />} accent="emerald" />
          <StatCard label="Avg Test Score" value={`${avgScore}%`} icon={<Pencil size={18} />} accent="amber" />
          <StatCard label="Form Submissions" value={submissions?.length ?? 0} icon={<FileText size={18} />} accent="sky" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Status Breakdown */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 16px" }}>
              Application Status Breakdown
            </h3>
            {(["pending", "shortlisted", "selected", "rejected"] as const).map((status) => {
              const count = (applications ?? []).filter((a) => a.status === status).length;
              const pct = totalApplied > 0 ? (count / totalApplied) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 13, color: "#5A5247", width: 80, textTransform: "capitalize", flexShrink: 0 }}>{status}</span>
                  <div style={{ flex: 1, height: 6, background: "#F3F0E8", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#4A55BE", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#19140F", width: 28, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Tours by Status */}
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 16px" }}>
              Tours by Status
            </h3>
            {(["draft", "open", "closed", "completed"] as const).map((status) => {
              const count = (tours ?? []).filter((t) => t.status === status).length;
              const total = (tours ?? []).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 13, color: "#5A5247", width: 80, textTransform: "capitalize", flexShrink: 0 }}>{status}</span>
                  <div style={{ flex: 1, height: 6, background: "#F3F0E8", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#4A55BE", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#19140F", width: 28, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
