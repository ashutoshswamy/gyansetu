"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createDailyLog, getMyDailyLogs } from "@/actions/daily-logs";
import { getMyToursForSelect } from "@/actions/tours";
import { BookOpen, Plus, X, AlertTriangle } from "lucide-react";
import type { DailyLog } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function DailyLogPage() {
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tourId, setTourId] = useState("");

  useEffect(() => {
    Promise.all([getMyDailyLogs(), getMyToursForSelect()]).then(([logData, tourData]) => {
      setLogs(logData as DailyLogRow[]);
      setTours(tourData);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tourId) {
      setError("Please select a tour.");
      return;
    }
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const date = fd.get("log_date") as string;
    const activities = (fd.get("activities_conducted") as string) || "";
    const achievements = (fd.get("key_achievements") as string) || "";
    const challenges = (fd.get("challenges_faced") as string) || "";
    const learning = (fd.get("biggest_learning") as string) || "";
    const impact = (fd.get("participant_impact") as string) || "";

    const allShort = [activities, achievements, challenges, learning, impact].filter(
      t => wordCount(t) < 50
    );

    if (allShort.length > 0) {
      const msg = "Each question answer must contain at least 50 words.";
      setError(msg);
      toast.error(msg);
      setSaving(false);
      return;
    }

    try {
      await createDailyLog({
        tour_id: tourId,
        log_date: date,
        activities_conducted: activities,
        key_achievements: achievements,
        challenges_faced: challenges,
        biggest_learning: learning,
        participant_impact: impact,
      });

      toast.success("Daily log saved successfully");
      setShowForm(false);
      setTourId("");
      const freshLogs = await getMyDailyLogs();
      setLogs(freshLogs as DailyLogRow[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save daily log";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Volunteer Portal</p>
            <h1 className="text-2xl font-bold text-foreground m-0">Daily Log</h1>
            <p className="text-sm text-muted-foreground mt-1">Field observations, activities and daily reflections</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Entry"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <h2 className="text-base font-semibold text-foreground mb-5 m-0">New Daily Log Entry</h2>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Tour <span className="text-destructive">*</span></Label>
                      <Select value={tourId} onValueChange={(val) => setTourId(val ?? "")}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select tour..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                      <Input name="log_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                  </div>
                  {QUESTIONS.map((q, i) => (
                    <div key={q.key} className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        {i + 1}. {q.label} <span className="text-destructive">*</span>
                      </Label>
                      <Textarea name={q.key} required rows={4} placeholder="Minimum 50 words..." className="min-h-[100px]" />
                    </div>
                  ))}
                </div>
                <Button type="submit" disabled={saving} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>Loading...</p>
        ) : logs.length === 0 ? (
          <Card>
<CardContent className="text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No daily log entries yet.</p>
            <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Start logging your field activities during the visit.</p>
          </CardContent>
</Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log: DailyLogRow) => (
              <Card key={log.id}>
<CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-success)", margin: 0 }}>{new Date(log.log_date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    {log.tours?.title && <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "2px 0 0" }}>{log.tours.title}</p>}
                  </div>
                </div>
                {isDelayed(log) && (
                  <div className="flex items-center gap-2" style={{ background: "rgba(var(--gs-warning-rgb), 0.08)", border: "1px solid rgba(var(--gs-warning-rgb), 0.25)", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                    <AlertTriangle size={14} style={{ color: "var(--gs-warning)", flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "var(--gs-warning-alt)", margin: 0 }}>
                      Delayed entry — submitted on {new Date(log.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, not the same day as the log date.
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <div key={q.key}>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 4 }}>{i + 1}. {q.label}</p>
                      <p style={{ fontSize: 14, color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>{log[q.key]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
</Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
