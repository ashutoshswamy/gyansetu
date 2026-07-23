"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkshop } from "@/actions/workshops";
import type { WorkshopType } from "@/types";

const WORKSHOP_TYPES: { value: WorkshopType; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "exhibition_cultural", label: "Exhibition & Cultural" },
  { value: "other", label: "Other" },
];

export default function NewWorkshopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [trainerChoice, setTrainerChoice] = useState<string>("");

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setTrainers(d.volunteers ?? []));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createWorkshop({
        title: fd.get("title") as string,
        workshop_type: fd.get("workshop_type") as WorkshopType,
        workshop_date: fd.get("workshop_date") as string,
        workshop_time: (fd.get("workshop_time") as string) || undefined,
        hall_location: (fd.get("hall_location") as string) || undefined,
        trainer_id: trainerChoice === "custom" ? undefined : (fd.get("trainer_id") as string) || undefined,
        trainer_name: trainerChoice === "custom" ? (fd.get("trainer_name") as string) || undefined : undefined,
        status: fd.get("status") as "scheduled" | "completed" | "cancelled",
        kit_ready: fd.get("kit_ready") === "on",
        plan_notes: (fd.get("plan_notes") as string) || undefined,
      });
      router.push("/admin/workshops");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workshop");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>New Workshop</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Title <span style={{ color: "#DC2626" }}>*</span></label>
              <input name="title" required style={inputStyle} placeholder="e.g. Science Workshop - Solar System" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Type <span style={{ color: "#DC2626" }}>*</span></label>
                <select name="workshop_type" required style={inputStyle}>
                  {WORKSHOP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Status <span style={{ color: "#DC2626" }}>*</span></label>
                <select name="status" required defaultValue="scheduled" style={inputStyle}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Date <span style={{ color: "#DC2626" }}>*</span></label>
                <input name="workshop_date" type="date" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Time</label>
                <input name="workshop_time" type="time" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Hall / Location</label>
              <input name="hall_location" style={inputStyle} placeholder="e.g. Main Hall" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Trainer (optional)</label>
              <select name="trainer_id" value={trainerChoice} onChange={e => setTrainerChoice(e.target.value)} style={inputStyle}>
                <option value="">No trainer assigned</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                <option value="custom">Custom / Other (not a registered volunteer)</option>
              </select>
              {trainerChoice === "custom" && (
                <input name="trainer_name" placeholder="Trainer's name" style={{ ...inputStyle, marginTop: 8 }} />
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Plan Notes</label>
              <textarea name="plan_notes" rows={3} placeholder="Preparation notes, agenda, materials needed..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div className="flex items-center gap-2">
              <input id="kit_ready" name="kit_ready" type="checkbox" style={{ width: 16, height: 16 }} />
              <label htmlFor="kit_ready" style={{ fontSize: 13, color: "#5A5247" }}>Kit is ready</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Workshop"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
