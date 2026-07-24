"use client";

import { useState, useEffect } from "react";
import { getMyTourReports, submitTourReport } from "@/actions/tour-reports";
import { FileBarChart, Plus, X } from "lucide-react";
import { INDIAN_STATES } from "@/lib/locations";
import type { TourReport, TourReportHost, TourReportLogisticsScores } from "@/types";

type TourReportRow = TourReport & { tour?: { id: string; title: string } | null };

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "#9B9188", bg: "rgba(155,145,136,0.10)" },
  submitted: { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:  { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
};

const EMPTY_HOST: TourReportHost = { organisation: "", contact_person_name: "", designation: "", mobile_number: "", state: "", district: "", block_taluk: "", village_city: "" };

const LOGISTICS_FIELDS: { key: keyof TourReportLogisticsScores; label: string }[] = [
  { key: "accommodation", label: "Accommodation" },
  { key: "food", label: "Food" },
  { key: "local_transport", label: "Local Transport" },
  { key: "coordination_communication", label: "Coordination & Communication" },
  { key: "safety_security", label: "Safety & Security" },
  { key: "overall_experience", label: "Overall Experience" },
];

const OBSERVATION_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "unique_features", label: "Unique Features of the Region", required: true },
  { key: "best_practices", label: "Best Practices Observed", required: true },
  { key: "cultural_observations", label: "Cultural Observations", required: true },
  { key: "challenges_faced", label: "Challenges Faced During the Visit", required: true },
  { key: "suggestions_future_teams", label: "Suggestions for Future Teams", required: true },
  { key: "important_contacts", label: "Important Local Contacts or Resources", required: true },
  { key: "places_worth_visiting", label: "Places Worth Visiting (Optional)", required: false },
];

const RECOMMENDATIONS = ["Highly Recommended", "Recommended", "Can be Considered", "Not Recommended"] as const;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function RatingScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            width: 26, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 600,
            border: value === n ? "1.5px solid #2A5E3A" : "1.5px solid #E4DFD1",
            background: value === n ? "#2A5E3A" : "#FAFAF7",
            color: value === n ? "white" : "#5A5247",
            cursor: "pointer",
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function VolunteerTourReportPage() {
  const [reports, setReports] = useState<TourReportRow[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asFinal, setAsFinal] = useState(false);

  const [tourId, setTourId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [hosts, setHosts] = useState<TourReportHost[]>([{ ...EMPTY_HOST }]);
  const [scores, setScores] = useState<TourReportLogisticsScores>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<string>("");
  const [suitableResidential, setSuitableResidential] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<string>("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    Promise.all([
      getMyTourReports(),
      fetch("/api/tours").then(r => r.json()),
    ]).then(([reportsData, toursData]) => {
      setReports(reportsData);
      setTours(Array.isArray(toursData) ? toursData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
  };

  function updateHost(i: number, field: keyof TourReportHost, value: string) {
    setHosts(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  }

  function resetForm() {
    setTourId(""); setLocationName(""); setHosts([{ ...EMPTY_HOST }]); setScores({});
    setObservations({}); setRecommendation(""); setSuitableResidential(""); setFollowUpRequired("");
    setRemarks(""); setAsFinal(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!tourId) { setError("Select a tour."); return; }
    if (!locationName.trim()) { setError("Location is required."); return; }

    if (asFinal) {
      for (const f of OBSERVATION_FIELDS) {
        if (!f.required) continue;
        const wc = wordCount(observations[f.key] ?? "");
        if (wc < 150) { setError(`"${f.label}" must be at least 150 words (currently ${wc}).`); return; }
      }
      for (const f of LOGISTICS_FIELDS) {
        if (!scores[f.key]) { setError(`Please rate "${f.label}".`); return; }
      }
      if (!recommendation) { setError("Select an overall recommendation."); return; }
      if (!suitableResidential) { setError("Select whether the location suits residential camps."); return; }
      if (!followUpRequired) { setError("Select whether follow-up is required."); return; }
    }

    setSaving(true);
    try {
      const report = await submitTourReport({
        tour_id: tourId,
        location_name: locationName,
        hosts: hosts.filter(h => Object.values(h).some(v => v?.trim())),
        logistics_scores: scores,
        unique_features: observations.unique_features,
        best_practices: observations.best_practices,
        cultural_observations: observations.cultural_observations,
        challenges_faced: observations.challenges_faced,
        suggestions_future_teams: observations.suggestions_future_teams,
        important_contacts: observations.important_contacts,
        places_worth_visiting: observations.places_worth_visiting,
        overall_recommendation: (recommendation || undefined) as TourReportRow["overall_recommendation"],
        suitable_residential_camps: suitableResidential ? suitableResidential === "yes" : undefined,
        follow_up_required: followUpRequired ? followUpRequired === "yes" : undefined,
        additional_remarks: remarks || undefined,
        status: asFinal ? "submitted" : "draft",
      });
      setReports(prev => [report, ...prev]);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit tour report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Tour Report</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Location report — fill one for each location visited</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          {/* Section 1: Location Details */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2A5E3A", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>1. Location Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "#DC2626" }}>*</span></label>
              <select value={tourId} onChange={e => setTourId(e.target.value)} required style={inputStyle}>
                <option value="">Select tour...</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Location Visited <span style={{ color: "#DC2626" }}>*</span></label>
              <input value={locationName} onChange={e => setLocationName(e.target.value)} required placeholder="e.g. Village / town name" style={inputStyle} />
            </div>
          </div>

          {/* Section 2: Local Organisations & Host Details */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2A5E3A", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>2. Local Organisations & Host Details</h2>
          <div className="space-y-4 mb-3">
            {hosts.map((h, i) => (
              <div key={i} style={{ border: "1px solid #E4DFD1", borderRadius: 8, padding: 16, position: "relative" }}>
                {hosts.length > 1 && (
                  <button type="button" onClick={() => setHosts(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "#9B9188" }}>
                    <X size={16} />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={h.organisation} onChange={e => updateHost(i, "organisation", e.target.value)} placeholder="Organisation" style={inputStyle} />
                  <input value={h.contact_person_name} onChange={e => updateHost(i, "contact_person_name", e.target.value)} placeholder="Contact Person Name" style={inputStyle} />
                  <input value={h.designation} onChange={e => updateHost(i, "designation", e.target.value)} placeholder="Designation" style={inputStyle} />
                  <input value={h.mobile_number} onChange={e => updateHost(i, "mobile_number", e.target.value)} type="tel" placeholder="Mobile Number" style={inputStyle} />
                  <select value={h.state} onChange={e => updateHost(i, "state", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select state...</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={h.district} onChange={e => updateHost(i, "district", e.target.value)} placeholder="District" style={inputStyle} />
                  <input value={h.block_taluk} onChange={e => updateHost(i, "block_taluk", e.target.value)} placeholder="Block / Taluk (if possible)" style={inputStyle} />
                  <input value={h.village_city} onChange={e => updateHost(i, "village_city", e.target.value)} placeholder="Village / City" style={inputStyle} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHosts(prev => [...prev, { ...EMPTY_HOST }])} className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>
            <Plus size={14} /> Add another host / organisation
          </button>

          {/* Section 3: Logistics Rating */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2A5E3A", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>3. Logistics Rating</h2>
          <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 12px" }}>Rate each parameter from 1 (Poor) to 10 (Excellent)</p>
          <div className="space-y-3 mb-6">
            {LOGISTICS_FIELDS.map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4 flex-wrap">
                <label style={{ fontSize: 13, color: "#5A5247", minWidth: 200 }}>{f.label}</label>
                <RatingScale value={scores[f.key] ?? 0} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
              </div>
            ))}
          </div>

          {/* Section 4: Observations */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2A5E3A", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>4. Observations</h2>
          <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 12px" }}>Minimum 150 words each (except where marked optional)</p>
          <div className="space-y-4 mb-6">
            {OBSERVATION_FIELDS.map(f => {
              const text = observations[f.key] ?? "";
              const wc = wordCount(text);
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247" }}>
                      {f.label} {f.required && <span style={{ color: "#DC2626" }}>*</span>}
                    </label>
                    {f.required && (
                      <span style={{ fontSize: 11, color: wc >= 150 ? "#2A5E3A" : "#9B9188" }}>{wc} / 150 words</span>
                    )}
                  </div>
                  <textarea
                    value={text}
                    onChange={e => setObservations(o => ({ ...o, [f.key]: e.target.value }))}
                    rows={4}
                    placeholder={f.required ? "Minimum 150 words..." : "Optional..."}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              );
            })}
          </div>

          {/* Section 5: Visit Summary */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2A5E3A", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>5. Visit Summary</h2>
          <div className="space-y-4 mb-2">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Overall Recommendation</label>
              <select value={recommendation} onChange={e => setRecommendation(e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Suitable for Residential Camps</label>
                <select value={suitableResidential} onChange={e => setSuitableResidential(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Follow-up Required</label>
                <select value={followUpRequired} onChange={e => setFollowUpRequired(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Additional Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Anything else to add..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>

          <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#5A5247", margin: "20px 0 0" }}>
            <input type="checkbox" checked={asFinal} onChange={(e) => setAsFinal(e.target.checked)} />
            Submit as final (otherwise saved as draft)
          </label>
          <button type="submit" disabled={saving} style={{ marginTop: 16, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Submitting..." : asFinal ? "Submit Final Report" : "Save Draft"}
          </button>
        </form>

        {loading ? (
          <p style={{ color: "#9B9188", fontSize: 14 }}>Loading...</p>
        ) : reports.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <FileBarChart className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No tour reports yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const s = statusColors[r.status] ?? statusColors.draft;
              return (
                <div key={r.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "18px 22px" }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{r.location_name}</span>
                    <span style={{ fontSize: 12, color: "#9B9188" }}>{r.tour?.title ?? "Unknown tour"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 8px" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                  {r.overall_recommendation && (
                    <p style={{ fontSize: 13, color: "#19140F", margin: 0 }}>Recommendation: <strong>{r.overall_recommendation}</strong></p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
