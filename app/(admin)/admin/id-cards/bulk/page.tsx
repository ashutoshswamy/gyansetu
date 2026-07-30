"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkCreateIdCards } from "@/actions/id-cards";
import { getGroupsByTour } from "@/actions/groups";
import { VolunteerChecklist } from "@/components/features/volunteers/volunteer-checklist";

type Volunteer = { id: string; name: string; email: string };
type Group = {
  id: string;
  name: string;
  state_allocated?: string | null;
  tour_group_members?: { users?: Volunteer | null }[];
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
};

export default function BulkIdCardsPage() {
  const router = useRouter();
  const [tours, setTours] = useState<{ id: string; title: string; destination: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [place, setPlace] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!tourId) return;
    getGroupsByTour(tourId).then(g => setGroups(g as Group[])).catch(() => setGroups([]));
    fetch(`/api/volunteers?tourId=${tourId}`).then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, [tourId]);

  function handleTourChange(id: string) {
    setTourId(id);
    setGroupId("");
    setGroups([]);
    setVolunteers([]);
    setSelected(new Set());
    setPlace(tours.find(t => t.id === id)?.destination ?? "");
  }

  const selectedGroup = groups.find(g => g.id === groupId);
  const state = selectedGroup?.state_allocated ?? "";

  const roster = groupId
    ? (selectedGroup?.tour_group_members ?? []).map(m => m.users).filter((u): u is Volunteer => !!u)
    : volunteers;

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tourId) { fail("Select a tour."); return; }
    if (selected.size === 0) { fail("Select at least one volunteer."); return; }
    if (!validFrom || !validTo) { fail("Set the validity window."); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await bulkCreateIdCards({
        tour_id: tourId,
        group_id: groupId || undefined,
        volunteer_ids: Array.from(selected),
        valid_from: validFrom,
        valid_to: validTo,
        state: state || undefined,
        place: place || undefined,
      });
      const parts = [`${result.issued} card${result.issued === 1 ? "" : "s"} issued`];
      if (result.skipped) parts.push(`${result.skipped} already had one`);
      if (result.failed.length) parts.push(`${result.failed.length} failed`);
      if (result.failed.length) toast.error(parts.join(", ")); else toast.success(parts.join(", "));
      router.push("/admin/id-cards");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Failed to bulk issue ID cards");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Bulk Issue ID Cards</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Pick a tour, optionally narrow to one group, select volunteers, and issue cards to all of them at once.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
                <select value={tourId} onChange={e => handleTourChange(e.target.value)} required style={inputStyle}>
                  <option value="">Select tour...</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group</label>
                <select value={groupId} onChange={e => { setGroupId(e.target.value); setSelected(new Set()); }} disabled={!tourId} style={inputStyle}>
                  <option value="">All applied volunteers</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#9B9188", margin: "-10px 0 0" }}>
              Card numbers are generated automatically per volunteer. State comes from the group&apos;s allocated state.
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Place</label>
              <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Enter place" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid From <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid To <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Volunteers <span style={{ color: "#DC2626" }}>*</span></label>
              <VolunteerChecklist volunteers={roster} selected={selected} onChange={setSelected} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading || selected.size === 0} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading || selected.size === 0 ? "not-allowed" : "pointer", opacity: loading || selected.size === 0 ? 0.7 : 1 }}>
              {loading ? "Issuing..." : selected.size ? `Issue ${selected.size} Card${selected.size === 1 ? "" : "s"}` : "Issue Cards"}
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
