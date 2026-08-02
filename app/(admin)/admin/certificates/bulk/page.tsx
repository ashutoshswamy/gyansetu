"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkIssueCertificates } from "@/actions/certificates";
import { getGroupsByTour } from "@/actions/groups";
import { VolunteerChecklist } from "@/components/features/volunteers/volunteer-checklist";
import type { CertificateType } from "@/types";

const CERT_TYPES: CertificateType[] = ["participation", "excellence", "leadership", "mentor"];

type Volunteer = { id: string; name: string; email: string };
type Group = { id: string; name: string; tour_group_members?: { users?: Volunteer | null }[] };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
};

export default function BulkCertificatesPage() {
  const router = useRouter();
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [certificateType, setCertificateType] = useState<CertificateType | "">("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [durationDays, setDurationDays] = useState("");
  const [notes, setNotes] = useState("");
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
  }

  const selectedGroup = groups.find(g => g.id === groupId);
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
    if (!certificateType) { fail("Select a certificate category."); return; }
    if (selected.size === 0) { fail("Select at least one volunteer."); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await bulkIssueCertificates({
        tour_id: tourId,
        certificate_type: certificateType,
        volunteer_ids: Array.from(selected),
        notes: notes || undefined,
        duration_of_visit: durationDays ? `${durationDays} Day${durationDays === "1" ? "" : "s"}` : undefined,
      });
      const parts = [`${result.issued} certificate${result.issued === 1 ? "" : "s"} issued`];
      if (result.skipped) parts.push(`${result.skipped} already had one`);
      if (result.skippedNoIdCard.length) parts.push(`${result.skippedNoIdCard.length} skipped (no ID card yet)`);
      if (result.failed.length) parts.push(`${result.failed.length} failed`);
      if (result.failed.length || result.skippedNoIdCard.length) toast.error(parts.join(", ")); else toast.success(parts.join(", "));
      router.push("/admin/certificates");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Failed to bulk issue certificates");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Bulk Issue Certificates</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Pick a tour, optionally narrow to one group, choose a category, select volunteers, and issue certificates to all of them at once.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
                <select value={tourId} onChange={e => handleTourChange(e.target.value)} required style={inputStyle}>
                  <option value="">Select tour...</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Certificate Category <span style={{ color: "#DC2626" }}>*</span></label>
                <select value={certificateType} onChange={e => setCertificateType(e.target.value as CertificateType)} required style={inputStyle}>
                  <option value="">Select category...</option>
                  {CERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Group</label>
              <select value={groupId} onChange={e => { setGroupId(e.target.value); setSelected(new Set()); }} disabled={!tourId} style={inputStyle}>
                <option value="">All applied volunteers</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <p style={{ fontSize: 11, color: "#9B9188", margin: "-10px 0 0" }}>
              State, Place, and Volunteer ID are pulled from each volunteer&apos;s ID card for this tour &mdash; anyone without one is skipped.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Duration of Visit (days)</label>
                <input type="number" min={1} step={1} value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="Optional" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reason for certificate, achievements... (applied to all)" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Volunteers <span style={{ color: "#DC2626" }}>*</span></label>
              <VolunteerChecklist volunteers={roster} selected={selected} onChange={setSelected} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading || selected.size === 0} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading || selected.size === 0 ? "not-allowed" : "pointer", opacity: loading || selected.size === 0 ? 0.7 : 1 }}>
              {loading ? "Issuing..." : selected.size ? `Issue ${selected.size} Certificate${selected.size === 1 ? "" : "s"}` : "Issue Certificates"}
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
