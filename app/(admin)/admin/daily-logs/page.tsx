import { getAllDailyLogs } from "@/actions/daily-logs";
import { BookOpen } from "lucide-react";
import type { DailyLog } from "@/types";

type DailyLogRow = DailyLog & {
  tours?: { id: string; title: string } | null;
  users?: { id: string; name: string; email: string } | null;
};

export default async function AdminDailyLogsPage() {
  const logs = (await getAllDailyLogs()) as DailyLogRow[];

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Daily Logs</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{logs.length} entries across all volunteers</p>
        </div>

        <div className="space-y-3">
          {logs.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 15, color: "#5A5247" }}>No daily log entries yet.</p>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{log.users?.name ?? "Unknown volunteer"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                      {new Date(log.log_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                    {log.users?.email} {log.tours?.title && `· ${log.tours.title}`}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Activities</p>
                  <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{log.activities}</p>
                </div>
                {log.observations && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Observations</p>
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{log.observations}</p>
                  </div>
                )}
                {log.challenges && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>Challenges</p>
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{log.challenges}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
