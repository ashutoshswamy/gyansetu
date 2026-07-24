import { getAllDailyLogs } from "@/actions/daily-logs";
import { BookOpen, AlertTriangle } from "lucide-react";
import type { DailyLog } from "@/types";

type DailyLogRow = DailyLog & {
  tours?: { id: string; title: string } | null;
  users?: { id: string; name: string; email: string } | null;
};

const QUESTIONS = [
  { key: "activities_conducted", label: "What activities did your team conduct today?" },
  { key: "key_achievements", label: "What were the key achievements or outcomes of the day?" },
  { key: "challenges_faced", label: "What challenges did you face today?" },
  { key: "biggest_learning", label: "What was your biggest learning or observation today?" },
  { key: "participant_impact", label: "What impact did you observe on the participants today?" },
] as const;

// A log is "delayed" when it was submitted (created_at) on a different calendar day than
// the day it's actually reporting on (log_date).
function isDelayed(log: DailyLogRow) {
  const logDate = new Date(log.log_date).toDateString();
  const submittedDate = new Date(log.created_at).toDateString();
  return logDate !== submittedDate;
}

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
              {isDelayed(log) && (
                <div className="flex items-center gap-2" style={{ background: "rgba(245,165,32,0.08)", border: "1px solid rgba(245,165,32,0.25)", borderRadius: 6, padding: "8px 12px", margin: "10px 0" }}>
                  <AlertTriangle size={14} style={{ color: "#F5A520", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#A8641C", margin: 0 }}>
                    Delayed entry — submitted on {new Date(log.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, not the same day as the log date.
                  </p>
                </div>
              )}
              <div className="space-y-2 mt-3">
                {QUESTIONS.map((q, i) => (
                  <div key={q.key}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>{i + 1}. {q.label}</p>
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{log[q.key]}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
