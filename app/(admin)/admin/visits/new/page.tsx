"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVisit } from "@/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = {
  title: string;
  destination: string;
  state: string;
  start_date: string;
  end_date: string;
  description: string;
  timetable_url: string;
  capacity: string;
  status: "upcoming" | "ongoing" | "completed";
};

const INITIAL: FormState = {
  title: "",
  destination: "",
  state: "",
  start_date: "",
  end_date: "",
  description: "",
  timetable_url: "",
  capacity: "",
  status: "upcoming",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export default function NewVisitPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { fail("Title is required."); return; }
    if (!form.destination.trim()) { fail("Destination is required."); return; }
    if (!form.start_date) { fail("Start date is required."); return; }
    if (!form.end_date) { fail("End date is required."); return; }
    if (form.end_date < form.start_date) { fail("End date must be on or after start date."); return; }

    setSubmitting(true);
    try {
      await createVisit({
        title: form.title.trim(),
        destination: form.destination.trim(),
        state: form.state.trim() || undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim() || undefined,
        timetable_url: form.timetable_url.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        status: form.status,
      });
      router.push("/admin/visits");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Failed to create visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-1 h-auto p-0 pb-[18px] font-medium text-[var(--gs-muted)] hover:bg-transparent hover:text-[var(--gs-muted)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </Button>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gs-muted)", margin: "0 0 6px" }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>New Visit</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", margin: 0 }}>Add a Jnana Pravas visit to the schedule.</p>
        </div>

        {/* Form card */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "32px 32px 28px",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div style={fieldStyle}>
              <Label className="mb-1.5">Visit Title <span style={{ color: "var(--gs-warning)" }}>*</span></Label>
              <Input
                type="text"
                placeholder="e.g. Rajasthan Jnana Pravas 2025"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>

            {/* Destination + State */}
            <div className="form-row-2" style={{ gap: 16 }}>
              <div style={fieldStyle}>
                <Label className="mb-1.5">Destination <span style={{ color: "var(--gs-warning)" }}>*</span></Label>
                <Input
                  type="text"
                  placeholder="e.g. Jaipur"
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                  required
                />
              </div>
              <div style={fieldStyle}>
                <Label className="mb-1.5">State/Union Territory</Label>
                <Input
                  type="text"
                  placeholder="e.g. Rajasthan"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </div>
            </div>

            {/* Start + End dates */}
            <div className="form-row-2" style={{ gap: 16 }}>
              <div style={fieldStyle}>
                <Label className="mb-1.5">Start Date <span style={{ color: "var(--gs-warning)" }}>*</span></Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  required
                />
              </div>
              <div style={fieldStyle}>
                <Label className="mb-1.5">End Date <span style={{ color: "var(--gs-warning)" }}>*</span></Label>
                <Input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={(e) => set("end_date", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div style={fieldStyle}>
              <Label className="mb-1.5">Description</Label>
              <Textarea
                className="min-h-24"
                placeholder="Visit objectives, activities, program outline..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
              />
            </div>

            {/* Timetable URL */}
            <div style={fieldStyle}>
              <Label className="mb-1.5">Timetable URL</Label>
              <Input
                type="url"
                placeholder="https://drive.google.com/... or direct PDF link"
                value={form.timetable_url}
                onChange={(e) => set("timetable_url", e.target.value)}
              />
              <p style={{ fontSize: 11.5, color: "var(--gs-muted)", margin: "5px 0 0" }}>
                Direct link to a PDF, Google Doc, or any public document. Shown as &quot;View Timetable&quot; on the public page.
              </p>
            </div>

            {/* Capacity + Status */}
            <div className="form-row-2" style={{ gap: 16 }}>
              <div style={fieldStyle}>
                <Label className="mb-1.5">Capacity (seats)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </div>
              <div style={fieldStyle}>
                <Label className="mb-1.5">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => set("status", value as FormState["status"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Visit"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
