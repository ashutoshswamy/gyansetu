"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/actions/events";

const EVENT_TYPES = ["katta", "training", "workshop", "meeting", "demo", "presentation", "celebration", "other"] as const;
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

type Tour = { id: string; title: string };

interface InitialData {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  tour_id?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  status: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
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

export function EventForm({ tours, initialData }: { tours: Tour[]; initialData?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      event_type: fd.get("event_type") as any,
      tour_id: (fd.get("tour_id") as string) || undefined,
      event_date: fd.get("event_date") as string,
      event_time: (fd.get("event_time") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
      status: fd.get("status") as any,
    };
    try {
      if (isEdit) {
        await updateEvent(initialData.id, payload);
      } else {
        await createEvent(payload);
      }
      router.push("/admin/events");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div className="space-y-5">
        <Field label="Title" required>
          <input name="title" required defaultValue={initialData?.title} placeholder="e.g. Gyan Setu Katta – Pre-Visit Orientation" style={inputStyle} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Event Type" required>
            <select name="event_type" required defaultValue={initialData?.event_type ?? "katta"} style={inputStyle}>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Status" required>
            <select name="status" required defaultValue={initialData?.status ?? "upcoming"} style={inputStyle}>
              {EVENT_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" required>
            <input name="event_date" type="date" required defaultValue={initialData?.event_date} style={inputStyle} />
          </Field>

          <Field label="Time">
            <input name="event_time" type="time" defaultValue={initialData?.event_time ?? ""} style={inputStyle} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location">
            <input name="location" defaultValue={initialData?.location ?? ""} placeholder="e.g. Pune / Online / School Hall" style={inputStyle} />
          </Field>

          <Field label="Linked Tour">
            <select name="tour_id" defaultValue={initialData?.tour_id ?? ""} style={inputStyle}>
              <option value="">No tour</option>
              {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea name="description" rows={4} defaultValue={initialData?.description ?? ""} placeholder="Agenda, objectives, notes..." style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
