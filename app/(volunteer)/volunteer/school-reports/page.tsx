"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { School, Plus, X } from "lucide-react";
import { getGroupsForSelect } from "@/actions/groups";
import { submitSchoolReport, getGroupSchoolReports, getGroupMembersForSchoolReport } from "@/actions/school-reports";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";
import type { SchoolReportSession } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Group = { id: string; name: string; tours?: { title: string } | null };
type Member = { id: string; name: string };
type ReportRow = {
  id: string;
  school_name: string;
  status: "draft" | "submitted";
  overall_rating?: string | null;
  created_at: string;
  submitter?: { id: string; name: string } | null;
};

const SCHOOL_TYPES = ["Government", "Government Aided", "Private", "Ashram School", "ZP School", "Other"] as const;
const LOCATION_CATEGORIES = ["Rural", "Semi-Urban", "Urban"] as const;
const MEDIUMS = ["Marathi", "Hindi", "English", "Assamese", "Urdu", "Other"] as const;
const STANDARDS = ["Below 5th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"] as const;
const LANGUAGES = ["Hindi", "English", "Both (English - Marathi)"] as const;
const THEMES = ["Science", "Mathematics", "Exhibition", "Other"] as const;
const RATINGS = ["Excellent", "Good", "Satisfactory", "Needs Improvement"] as const;

const EMPTY_SESSION: SchoolReportSession = { standard: "", division: "", num_students: undefined, theme_topic: "", duration_minutes: undefined, language_used: "", combined_session: false };

const OBSERVATION_FIELDS: { key: string; label: string }[] = [
  { key: "student_response", label: "Student Response" },
  { key: "what_went_well", label: "What Went Well" },
  { key: "challenges_faced", label: "Challenges Faced" },
  { key: "solutions_adopted", label: "Solutions Adopted" },
  { key: "suggestions_improvement", label: "Suggestions for Improvement" },
  { key: "memorable_moment", label: "Interesting Incident / Memorable Moment" },
  { key: "overall_feedback", label: "Overall Feedback" },
];

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.10)" },
  submitted: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function durationMinutes(arrival: string, departure: string) {
  if (!arrival || !departure) return null;
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  if ([ah, am, dh, dm].some(Number.isNaN)) return null;
  const mins = (dh * 60 + dm) - (ah * 60 + am);
  return mins >= 0 ? mins : null;
}

export default function SchoolReportsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asFinal, setAsFinal] = useState(false);

  // Section 1
  const [schoolName, setSchoolName] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [locationCategory, setLocationCategory] = useState("");
  const [medium, setMedium] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [villageTown, setVillageTown] = useState("");
  const [talukaTehsil, setTalukaTehsil] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [principalMobile, setPrincipalMobile] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorMobile, setCoordinatorMobile] = useState("");

  // Section 2
  const [visitDate, setVisitDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [volunteersPresent, setVolunteersPresent] = useState("");
  const [volunteerNames, setVolunteerNames] = useState<string[]>([]);

  // Section 3
  const [sessions, setSessions] = useState<SchoolReportSession[]>([{ ...EMPTY_SESSION }]);

  // Section 4
  const [observations, setObservations] = useState<Record<string, string>>({});

  // Section 5
  const [rating, setRating] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const autoDuration = useMemo(() => durationMinutes(arrivalTime, departureTime), [arrivalTime, departureTime]);

  useEffect(() => {
    getGroupsForSelect().then(data => setGroups(data as unknown as Group[])).catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([getGroupMembersForSchoolReport(groupId), getGroupSchoolReports(groupId)])
      .then(([m, r]) => { setMembers(m); setReports(r as unknown as ReportRow[]); })
      .catch(() => { setMembers([]); setReports([]); })
      .finally(() => setLoadingGroup(false));
  }, [groupId]);

  function handleGroupChange(id: string) {
    setGroupId(id);
    setMembers([]);
    setReports([]);
    setVolunteerNames([]);
    setLoadingGroup(!!id);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
  };

  function updateSession(i: number, field: keyof SchoolReportSession, value: string | number | boolean) {
    setSessions(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function toggleVolunteer(name: string) {
    setVolunteerNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  function resetForm() {
    setSchoolName(""); setSchoolType(""); setLocationCategory(""); setMedium("");
    setStreetArea(""); setVillageTown(""); setTalukaTehsil(""); setDistrict(""); setState(""); setPincode("");
    setPrincipalName(""); setPrincipalMobile(""); setCoordinatorName(""); setCoordinatorMobile("");
    setVisitDate(""); setArrivalTime(""); setDepartureTime(""); setVolunteersPresent(""); setVolunteerNames([]);
    setSessions([{ ...EMPTY_SESSION }]); setObservations({});
    setRating(""); setFollowUpRequired(""); setFollowUpDate(""); setRemarks(""); setAsFinal(false);
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!groupId) { fail("Select a group first."); return; }
    if (!schoolName.trim()) { fail("School name is required."); return; }

    if (asFinal) {
      for (const f of OBSERVATION_FIELDS) {
        const wc = wordCount(observations[f.key] ?? "");
        if (wc < 50) { fail(`"${f.label}" must be at least 50 words (currently ${wc}).`); return; }
      }
    }

    setSaving(true);
    try {
      const report = await submitSchoolReport({
        group_id: groupId,
        school_name: schoolName,
        school_type: (schoolType || undefined) as typeof SCHOOL_TYPES[number] | undefined,
        location_category: (locationCategory || undefined) as typeof LOCATION_CATEGORIES[number] | undefined,
        medium_of_instruction: (medium || undefined) as typeof MEDIUMS[number] | undefined,
        street_area: streetArea || undefined,
        village_town: villageTown || undefined,
        taluka_tehsil: talukaTehsil || undefined,
        district: district || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        principal_name: principalName || undefined,
        principal_mobile: principalMobile || undefined,
        coordinator_name: coordinatorName || undefined,
        coordinator_mobile: coordinatorMobile || undefined,
        visit_date: visitDate || undefined,
        arrival_time: arrivalTime || undefined,
        departure_time: departureTime || undefined,
        total_duration_minutes: autoDuration ?? undefined,
        volunteers_present_count: volunteersPresent ? Number(volunteersPresent) : undefined,
        volunteer_names: volunteerNames,
        sessions: sessions.filter(s => Object.values(s).some(v => v !== "" && v !== undefined && v !== false)),
        student_response: observations.student_response,
        what_went_well: observations.what_went_well,
        challenges_faced: observations.challenges_faced,
        solutions_adopted: observations.solutions_adopted,
        suggestions_improvement: observations.suggestions_improvement,
        memorable_moment: observations.memorable_moment,
        overall_feedback: observations.overall_feedback,
        overall_rating: (rating || undefined) as typeof RATINGS[number] | undefined,
        follow_up_required: followUpRequired ? followUpRequired === "yes" : undefined,
        follow_up_date: followUpDate || undefined,
        additional_remarks: remarks || undefined,
        status: asFinal ? "submitted" : "draft",
      });
      setReports(prev => [report, ...prev]);
      resetForm();
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : "Failed to submit school report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>School Details</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>School visit report — fill one for each school visit. Shared with your whole group.</p>
        </div>

        <Card>
<CardContent>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Group <span style={{ color: "var(--gs-danger)" }}>*</span></label>
          <select value={groupId} onChange={e => handleGroupChange(e.target.value)} style={inputStyle}>
            <option value="">Select group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}{g.tours?.title ? ` — ${g.tours.title}` : ""}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 6 }}>
            Every report submitted under this group is visible to all volunteers in the same group.
          </p>
        </CardContent>
</Card>

        {groupId && (
          <Card>
<CardContent>
<form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
                {error}
              </div>
            )}

            {/* Section 1: School Details */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>1. School Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>School Name <span style={{ color: "var(--gs-danger)" }}>*</span></label>
                <input value={schoolName} onChange={e => setSchoolName(e.target.value)} required placeholder="Enter full school name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>School Type <span style={{ color: "var(--gs-danger)" }}>*</span></label>
                <select value={schoolType} onChange={e => setSchoolType(e.target.value)} required style={inputStyle}>
                  <option value="">Select...</option>
                  {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Location Category <span style={{ color: "var(--gs-danger)" }}>*</span></label>
                <select value={locationCategory} onChange={e => setLocationCategory(e.target.value)} required style={inputStyle}>
                  <option value="">Select...</option>
                  {LOCATION_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Medium of Instruction <span style={{ color: "var(--gs-danger)" }}>*</span></label>
                <select value={medium} onChange={e => setMedium(e.target.value)} required style={inputStyle}>
                  <option value="">Select...</option>
                  {MEDIUMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", margin: "0 0 8px" }}>School Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input value={streetArea} onChange={e => setStreetArea(e.target.value)} placeholder="Street / Area" style={inputStyle} />
              <input value={villageTown} onChange={e => setVillageTown(e.target.value)} placeholder="Village / Town" style={inputStyle} />
              <input value={talukaTehsil} onChange={e => setTalukaTehsil(e.target.value)} placeholder="Taluka / Tehsil" style={inputStyle} />
              <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} style={inputStyle} />
              <select value={state} onChange={e => { setState(e.target.value); setDistrict(""); }} style={inputStyle}>
                <option value="">Select State/Union Territory...</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="PIN Code (6 digits)" style={inputStyle} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <input value={principalName} onChange={e => setPrincipalName(e.target.value)} placeholder="Principal Name" style={inputStyle} />
              <input value={principalMobile} onChange={e => setPrincipalMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Principal Mobile Number (10 digits)" style={inputStyle} />
              <input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} placeholder="School Coordinator / Science Teacher Name" style={inputStyle} />
              <input value={coordinatorMobile} onChange={e => setCoordinatorMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Coordinator Contact Number (10 digits)" style={inputStyle} />
            </div>

            {/* Section 2: Visit Details */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>2. Visit Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Visit Date</label>
                <input value={visitDate} onChange={e => setVisitDate(e.target.value)} type="date" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Number of Volunteers Present</label>
                <input value={volunteersPresent} onChange={e => setVolunteersPresent(e.target.value ? String(Math.min(50, Number(e.target.value))) : "")} type="number" min="0" max="50" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Arrival Time</label>
                <input value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} type="time" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Departure Time</label>
                <input value={departureTime} onChange={e => setDepartureTime(e.target.value)} type="time" style={inputStyle} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "0 0 12px" }}>
              Total Duration in School: <strong>{autoDuration !== null ? `${autoDuration} minutes` : "—"}</strong>
            </p>
            <div className="mb-6">
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Volunteer Names</label>
              {loadingGroup ? (
                <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>Loading group members...</p>
              ) : members.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--gs-muted)" }}>No members found for this group.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-1.5" style={{ fontSize: 13, color: "var(--foreground)", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
                      <input type="checkbox" checked={volunteerNames.includes(m.name)} onChange={() => toggleVolunteer(m.name)} />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Session Details */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>3. Session Details</h2>
            <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 12px" }}>Add one row for each session conducted.</p>
            <div className="space-y-4 mb-3">
              {sessions.map((s, i) => {
                const inheritedFromCombined = i > 0 && !!sessions[i - 1].combined_session;
                return (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, position: "relative" }}>
                  {sessions.length > 1 && (
                    <button type="button" onClick={() => setSessions(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--gs-muted)" }}>
                      <X size={16} />
                    </button>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gs-muted)", marginBottom: 10 }}>Session {i + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={s.standard} onChange={e => updateSession(i, "standard", e.target.value)} style={inputStyle}>
                      <option value="">Standard / Class...</option>
                      {STANDARDS.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <input value={s.division ?? ""} onChange={e => updateSession(i, "division", e.target.value)} placeholder="Division" style={inputStyle} />
                    <input value={s.num_students ?? ""} onChange={e => updateSession(i, "num_students", e.target.value ? Math.min(500, Number(e.target.value)) : "")} type="number" min="0" max="500" placeholder="No. of Students" style={inputStyle} />
                    {!inheritedFromCombined && (
                      <>
                        <select value={s.theme_topic ?? ""} onChange={e => updateSession(i, "theme_topic", e.target.value)} style={inputStyle}>
                          <option value="">Theme / Topic...</option>
                          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input value={s.duration_minutes ?? ""} onChange={e => updateSession(i, "duration_minutes", e.target.value ? Math.min(480, Number(e.target.value)) : "")} type="number" min="0" max="480" placeholder="Duration (Minutes)" style={inputStyle} />
                        <select value={s.language_used ?? ""} onChange={e => updateSession(i, "language_used", e.target.value)} style={inputStyle}>
                          <option value="">Language Used...</option>
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                  {inheritedFromCombined && (
                    <p style={{ fontSize: 11, color: "var(--gs-muted)", marginTop: 8 }}>
                      Theme / Topic, Duration and Language carried over from the combined session above.
                    </p>
                  )}
                  <label className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 10 }}>
                    <input type="checkbox" checked={!!s.combined_session} onChange={e => updateSession(i, "combined_session", e.target.checked)} />
                    Combined session (conducted for all students together)
                  </label>
                </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setSessions(prev => {
                const last = prev[prev.length - 1];
                const next: SchoolReportSession = last?.combined_session
                  ? { ...EMPTY_SESSION, theme_topic: last.theme_topic, duration_minutes: last.duration_minutes, language_used: last.language_used }
                  : { ...EMPTY_SESSION };
                return [...prev, next];
              })}
              className="flex items-center gap-1.5"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-accent)", background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}
            >
              <Plus size={14} /> Add another session
            </button>

            {/* Section 4: Reflection & Observations */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>4. Reflection & Observations</h2>
            <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 12px" }}>Minimum 50 words each (required to submit final)</p>
            <div className="space-y-4 mb-6">
              {OBSERVATION_FIELDS.map(f => {
                const text = observations[f.key] ?? "";
                const wc = wordCount(text);
                return (
                  <div key={f.key}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)" }}>{f.label} <span style={{ color: "var(--gs-danger)" }}>*</span></label>
                      <span style={{ fontSize: 11, color: wc >= 50 ? "var(--gs-success)" : "var(--gs-muted)" }}>{wc} / 50 words</span>
                    </div>
                    <textarea
                      value={text}
                      onChange={e => setObservations(o => ({ ...o, [f.key]: e.target.value }))}
                      rows={4}
                      placeholder="Minimum 50 words..."
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Section 5: Visit Summary */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--gs-success)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>5. Visit Summary</h2>
            <div className="space-y-4 mb-2">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Overall Visit Rating</label>
                <select value={rating} onChange={e => setRating(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Follow-up Visit Required</label>
                  <select value={followUpRequired} onChange={e => setFollowUpRequired(e.target.value)} style={inputStyle}>
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {followUpRequired === "yes" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Suggested Date for Follow-up</label>
                    <input value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} type="date" style={inputStyle} />
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Additional Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Anything else to add..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>

            <label className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "20px 0 0" }}>
              <input type="checkbox" checked={asFinal} onChange={e => setAsFinal(e.target.checked)} />
              Submit as final (otherwise saved as draft)
            </label>
            <button type="submit" disabled={saving} style={{ marginTop: 16, background: "var(--gs-success)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Submitting..." : asFinal ? "Submit Final Report" : "Save Draft"}
            </button>
          </form>
</CardContent>
</Card>
        )}

        {groupId && (
          loadingGroup ? (
            <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>Loading...</p>
          ) : reports.length === 0 ? (
            <Card>
<CardContent>
              <School className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No school reports yet for this group.</p>
            </CardContent>
</Card>
          ) : (
            <div className="space-y-4">
              {reports.map(r => {
                const s = statusColors[r.status] ?? statusColors.draft;
                return (
                  <Card key={r.id}>
<CardContent>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{r.school_name}</span>
                      <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>by {r.submitter?.name ?? "Unknown"}</span>
                      <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>
                        {r.status}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 8px" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                    {r.overall_rating && (
                      <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>Rating: <strong>{r.overall_rating}</strong></p>
                    )}
                  </CardContent>
</Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
