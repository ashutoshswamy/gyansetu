"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createIdCard } from "@/actions/id-cards";
import { getGroupsByTour } from "@/actions/groups";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";

type Group = { id: string; name: string; tour_group_members?: { users?: { id: string } | null }[] };

export default function NewIdCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string; volunteer_profiles?: { photo_url?: string } | null }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");
  const selectedPhoto = volunteers.find(v => v.id === volunteerId)?.volunteer_profiles?.photo_url;
  const [tours, setTours] = useState<{ id: string; title: string; destination: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  function autoMatchGroup(list: Group[], forVolunteerId: string) {
    return list.find(g => g.tour_group_members?.some(m => m.users?.id === forVolunteerId));
  }

  useEffect(() => {
    if (!tourId) return;
    getGroupsByTour(tourId).then(g => {
      const list = g as Group[];
      setGroups(list);
      const match = autoMatchGroup(list, volunteerId);
      if (match) setGroupId(match.id);
    }).catch(() => setGroups([]));
    // Only refetch when the tour changes — volunteer changes are handled by handleVolunteerChange below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  function handleTourChange(id: string) {
    setTourId(id);
    setGroupId("");
    setGroups([]);
  }

  function handleVolunteerChange(id: string) {
    setVolunteerId(id);
    const match = autoMatchGroup(groups, id);
    if (match) setGroupId(match.id);
  }

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
      await createIdCard({
        volunteer_id: fd.get("volunteer_id") as string,
        tour_id: fd.get("tour_id") as string,
        group_id: (fd.get("group_id") as string) || undefined,
        valid_from: fd.get("valid_from") as string,
        valid_to: fd.get("valid_to") as string,
        card_file_url: (fd.get("card_file_url") as string) || undefined,
      });
      router.push("/admin/id-cards");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue ID card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Issue ID Card</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Volunteer <span style={{ color: "#DC2626" }}>*</span></label>
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={handleVolunteerChange} name="volunteer_id" />
              {volunteerId && (
                selectedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPhoto} alt="Profile photo" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", marginTop: 8, border: "1px solid #E4DFD1" }} />
                ) : (
                  <p style={{ fontSize: 12, color: "#9B9188", marginTop: 6 }}>No profile photo uploaded by this volunteer yet — the card will show no photo unless one is added below.</p>
                )
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
                <select name="tour_id" required value={tourId} onChange={e => handleTourChange(e.target.value)} style={inputStyle}>
                  <option value="">Select tour...</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group</label>
                <select name="group_id" value={groupId} onChange={e => setGroupId(e.target.value)} disabled={!tourId} style={inputStyle}>
                  <option value="">No group / General</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#9B9188", margin: "-10px 0 0" }}>Card number is generated automatically from the tour, group, and issue sequence.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid From <span style={{ color: "#DC2626" }}>*</span></label>
                <input name="valid_from" type="date" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Valid To <span style={{ color: "#DC2626" }}>*</span></label>
                <input name="valid_to" type="date" required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Card Photo/File URL Override (optional)</label>
              <p style={{ fontSize: 11, color: "#9B9188", margin: "0 0 6px" }}>By default the card uses the volunteer&apos;s own profile photo. Only set this to override with a different image or attach a file (e.g. PDF).</p>
              <input name="card_file_url" type="url" style={inputStyle} placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Issuing..." : "Issue ID Card"}
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
