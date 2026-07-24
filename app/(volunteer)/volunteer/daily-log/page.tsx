"use client";

import { useState, useEffect } from "react";
import { createDailyLog, getMyDailyLogs } from "@/actions/daily-logs";
import { BookOpen, Plus, X, AlertTriangle } from "lucide-react";
import type { DailyLog } from "@/types";

type DailyLogRow = DailyLog & { tours?: { id: string; title: string } | null };

const QUESTIONS = [
  { key: "activities_conducted", label: "What activities did your team conduct today?" },
  { key: "key_achievements", label: "What were the key achievements or outcomes of the day?" },
  { key: "challenges_faced", label: "What challenges did you face today?" },
  { key: "biggest_learning", label: "What was your biggest learning or observation today?" },
  { key: "participant_impact", label: "What impact did you observe on the participants today?" },
] as const;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// A log is "delayed" when it was submitted (created_at) on a different calendar day than
// the day it's actually reporting on (log_date).
function isDelayed(log: DailyLogRow) {
  const logDate = new Date(log.log_date).toDateString();
  const submittedDate = new Date(log.created_at).toDateString();
  return logDate !== submittedDate;
}

export default function VolunteerDailyLogPage() {
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMyDailyLogs(),
      fetch("/api/tours").then(r => r.json()),
    ]).then(([logsData, toursData]) => {
      setLogs(logsData);
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
    setError(null);
    const fd = new FormData(e.currentTarget);

    for (const q of QUESTIONS) {
      const text = (fd.get(q.key) as string) || "";
      if (wordCount(text) < 50) {
        setError(`"${q.label}" must be at least 50 words (currently ${wordCount(text)}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const log = await createDailyLog({
        tour_id: fd.get("tour_id") as string,
        log_date: fd.get("log_date") as string,
        activities_conducted: fd.get("activities_conducted") as string,
        key_achievements: fd.get("key_achievements") as string,
        challenges_faced: fd.get("challenges_faced") as string,
        biggest_learning: fd.get("biggest_learning") as string,
        participant_impact: fd.get("participant_impact") as string,
      });
      setLogs(prev => [log, ...prev]);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create daily log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Daily Log</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Field observations, activities and daily reflections</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Entry"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: "0 0 20px" }}>New Daily Log Entry</h2>
            {error && (
              <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
                  <select name="tour_id" required style={inputStyle}>
                    <option value="">Select tour...</option>
                    {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Date <span style={{ color: "#DC2626" }}>*</span></label>
                  <input name="log_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} style={inputStyle} />
                </div>
              </div>
              {QUESTIONS.map((q, i) => (
                <div key={q.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
                    {i + 1}. {q.label} <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea name={q.key} required rows={4} placeholder="Minimum 50 words..." style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: 16, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ color: "#9B9188", fontSize: 14 }}>Loading...</p>
        ) : logs.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No daily log entries yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>Start logging your field activities during the visit.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log: DailyLogRow) => (
              <div key={log.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "18px 22px" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#2A5E3A", margin: 0 }}>{new Date(log.log_date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    {log.tours?.title && <p style={{ fontSize: 12, color: "#9B9188", margin: "2px 0 0" }}>{log.tours.title}</p>}
                  </div>
                </div>
                {isDelayed(log) && (
                  <div className="flex items-center gap-2" style={{ background: "rgba(245,165,32,0.08)", border: "1px solid rgba(245,165,32,0.25)", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                    <AlertTriangle size={14} style={{ color: "#F5A520", flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#A8641C", margin: 0 }}>
                      Delayed entry — submitted on {new Date(log.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, not the same day as the log date.
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <div key={q.key}>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 4 }}>{i + 1}. {q.label}</p>
                      <p style={{ fontSize: 14, color: "#19140F", margin: 0, whiteSpace: "pre-wrap" }}>{log[q.key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
