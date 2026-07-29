"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { issueCertificate } from "@/actions/certificates";
import { getLatestIdCardForVolunteer } from "@/actions/id-cards";
import type { CertificateType } from "@/types";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";

const CERT_TYPES = ["participation", "excellence", "leadership", "mentor"] as const;

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");
  const [tourId, setTourId] = useState("");
  const [idCard, setIdCard] = useState<{ card_number: string; state?: string | null; place?: string | null } | null>(null);
  const [idCardChecked, setIdCardChecked] = useState(false);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/tours").then(r => r.json()),
    ]).then(([toursData]) => {
      setTours(Array.isArray(toursData) ? toursData : []);
    });
    // Fetch volunteers from supabase via a simple endpoint
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  useEffect(() => {
    if (!volunteerId) {
      setIdCard(null);
      setIdCardChecked(false);
      return;
    }
    let cancelled = false;
    setIdCardChecked(false);
    getLatestIdCardForVolunteer(volunteerId, tourId || undefined).then(card => {
      if (cancelled) return;
      setIdCard(card ?? null);
      setIdCardChecked(true);
    });
    return () => { cancelled = true; };
  }, [volunteerId, tourId]);

  function handleVolunteerChange(id: string) {
    setVolunteerId(id);
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
    const durationDays = fd.get("duration_of_visit_days") as string;
    try {
      const cert = await issueCertificate({
        user_id: fd.get("user_id") as string,
        tour_id: fd.get("tour_id") as string || undefined,
        certificate_type: fd.get("certificate_type") as CertificateType,
        notes: fd.get("notes") as string || undefined,
        state: fd.get("state") as string || undefined,
        place: fd.get("place") as string || undefined,
        duration_of_visit: durationDays ? `${durationDays} Day${durationDays === "1" ? "" : "s"}` : undefined,
        volunteer_code: fd.get("volunteer_code") as string || undefined,
      });
      router.push(`/admin/certificates/${cert.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Issue Certificate</h1>
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
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={handleVolunteerChange} name="user_id" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Certificate Type <span style={{ color: "#DC2626" }}>*</span></label>
              <select name="certificate_type" required style={inputStyle}>
                {CERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour (optional)</label>
              <select name="tour_id" value={tourId} onChange={e => setTourId(e.target.value)} style={inputStyle}>
                <option value="">General (no specific tour)</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            {volunteerId && idCardChecked && !idCard && (
              <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
                No ID card found for this volunteer{tourId ? " on this tour" : ""}. Generate their ID card first &mdash;
                State, Place, and Volunteer ID are filled in automatically from it.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>State/Union Territory</label>
                <input name="state" value={idCard?.state ?? ""} readOnly placeholder="From volunteer's ID card" style={{ ...inputStyle, background: "#F0EEE6", color: "#5A5247" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Place</label>
                <input name="place" value={idCard?.place ?? ""} readOnly placeholder="From volunteer's ID card" style={{ ...inputStyle, background: "#F0EEE6", color: "#5A5247" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Duration of Visit (days)</label>
                <input name="duration_of_visit_days" type="number" min={1} step={1} placeholder="e.g. 5" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Volunteer ID</label>
                <input name="volunteer_code" value={idCard?.card_number ?? ""} readOnly placeholder="From volunteer's ID card" style={{ ...inputStyle, background: "#F0EEE6", color: "#5A5247" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Reason for certificate, achievements..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Issuing..." : "Issue Certificate"}
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
