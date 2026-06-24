"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/actions/events";

const EVENT_TYPES = ["katta", "training", "workshop", "meeting", "demo", "presentation", "celebration", "other"] as const;

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createEvent({
        title: fd.get("title") as string,
        description: fd.get("description") as string || undefined,
        event_type: fd.get("event_type") as any,
        event_date: fd.get("event_date") as string,
        location: fd.get("location") as string || undefined,
        status: "upcoming",
      });
      router.push("/admin/events");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>New Event</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <Field label="Title" required>
              <input name="title" required placeholder="e.g. Gyan Setu Katta – Pre-Visit Orientation" style={inputStyle} />
            </Field>

            <Field label="Event Type" required>
              <select name="event_type" required style={inputStyle}>
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>

            <Field label="Date" required>
              <input name="event_date" type="date" required style={inputStyle} />
            </Field>

            <Field label="Location">
              <input name="location" placeholder="e.g. Pune / Online / School Hall" style={inputStyle} />
            </Field>

            <Field label="Description">
              <textarea name="description" rows={4} placeholder="Agenda, objectives, notes..." style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 14,
  border: "1.5px solid #E4DFD1",
  borderRadius: 6,
  outline: "none",
  background: "#FAFAF7",
  color: "#19140F",
  boxSizing: "border-box",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
