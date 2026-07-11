"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVisit } from "@/actions/visits";

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  color: "#19140F",
  background: "#FAFAF7",
  border: "1.5px solid #E4DFD1",
  borderRadius: 6,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "#5A5247",
  letterSpacing: "0.03em",
  marginBottom: 6,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.destination.trim()) { setError("Destination is required."); return; }
    if (!form.start_date) { setError("Start date is required."); return; }
    if (!form.end_date) { setError("End date is required."); return; }
    if (form.end_date < form.start_date) { setError("End date must be on or after start date."); return; }

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
      setError(err instanceof Error ? err.message : "Failed to create visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#9B9188",
              fontWeight: 500,
              padding: "0 0 18px",
              fontFamily: "inherit",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9188", margin: "0 0 6px" }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#19140F", margin: "0 0 4px" }}>New Visit</h1>
          <p style={{ fontSize: 14, color: "#5A5247", margin: 0 }}>Add a Jnana Pravas visit to the schedule.</p>
        </div>

        {/* Form card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E4DFD1",
          borderRadius: 12,
          padding: "32px 32px 28px",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Visit Title <span style={{ color: "#F5A520" }}>*</span></label>
              <input
                style={inputStyle}
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
                <label style={labelStyle}>Destination <span style={{ color: "#F5A520" }}>*</span></label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="e.g. Jaipur"
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                  required
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>State</label>
                <input
                  style={inputStyle}
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
                <label style={labelStyle}>Start Date <span style={{ color: "#F5A520" }}>*</span></label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  required
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>End Date <span style={{ color: "#F5A520" }}>*</span></label>
                <input
                  style={inputStyle}
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
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 96 }}
                placeholder="Visit objectives, activities, program outline..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
              />
            </div>

            {/* Timetable URL */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Timetable URL</label>
              <input
                style={inputStyle}
                type="url"
                placeholder="https://drive.google.com/... or direct PDF link"
                value={form.timetable_url}
                onChange={(e) => set("timetable_url", e.target.value)}
              />
              <p style={{ fontSize: 11.5, color: "#9B9188", margin: "5px 0 0" }}>
                Direct link to a PDF, Google Doc, or any public document. Shown as &quot;View Timetable&quot; on the public page.
              </p>
            </div>

            {/* Capacity + Status */}
            <div className="form-row-2" style={{ gap: 16 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Capacity (seats)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as FormState["status"])}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(220,38,38,0.06)",
                border: "1.5px solid rgba(220,38,38,0.2)",
                borderRadius: 7,
                padding: "12px 16px",
                fontSize: 13.5,
                color: "#b91c1c",
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? "#8B93D4" : "#4A55BE",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "10px 24px",
                  borderRadius: 6,
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {submitting ? "Creating…" : "Create Visit"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  background: "transparent",
                  color: "#5A5247",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "1.5px solid #E4DFD1",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
