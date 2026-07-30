"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkshop } from "@/actions/workshops";
import { getAllGroups } from "@/actions/groups";
import type { WorkshopType } from "@/types";

const WORKSHOP_TYPES: { value: WorkshopType; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "exhibition_country", label: "Exhibition- Know our Country" },
  { value: "cultural_survey", label: "Cultural and Survey" },
  { value: "other", label: "Other" },
];

export default function NewWorkshopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [trainerChoice, setTrainerChoice] = useState<"none" | "gs_team_other">("none");

  useEffect(() => {
    getAllGroups().then(data => setGroups(data.map(g => ({ id: g.id, name: g.name }))));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
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
        trainer_name: trainerChoice === "gs_team_other" ? (fd.get("trainer_name") as string) || undefined : undefined,
        status: fd.get("status") as "scheduled" | "completed" | "cancelled",
        kit_ready: fd.get("kit_ready") === "on",
        plan_notes: (fd.get("plan_notes") as string) || undefined,
        group_ids: selectedGroupIds,
      });
      router.push("/admin/workshops");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workshop");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Trainer</label>
              <select name="trainer_choice" value={trainerChoice} onChange={e => setTrainerChoice(e.target.value as "none" | "gs_team_other")} style={inputStyle}>
                <option value="none">No trainer assigned</option>
                <option value="gs_team_other">GS Team / Other</option>
              </select>
              {trainerChoice === "gs_team_other" && (
                <input name="trainer_name" placeholder="Name" style={{ ...inputStyle, marginTop: 8 }} />
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Assign to Group</label>
              <select
                multiple
                value={selectedGroupIds}
                onChange={e => setSelectedGroupIds(Array.from(e.target.selectedOptions, o => o.value))}
                style={{ ...inputStyle, height: 110 }}
              >
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>Ctrl/Cmd-click to select multiple groups.</p>
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
