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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Group <span className="text-destructive">*</span></Label>
            <Select value={groupId} onValueChange={(val) => { if (val) handleGroupChange(val); }} items={groups.map(g => ({ value: g.id, label: `${g.name}${g.tours?.title ? ` — ${g.tours.title}` : ""}` }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}{g.tours?.title ? ` — ${g.tours.title}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Every report submitted under this group is visible to all volunteers in the same group.
            </p>
          </CardContent>
        </Card>

        {groupId && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Section 1: School Details */}
                <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">1. School Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">School Name <span className="text-destructive">*</span></Label>
                    <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} required placeholder="Enter full school name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">School Type <span className="text-destructive">*</span></Label>
                    <Select value={schoolType} onValueChange={(val) => setSchoolType(val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Location Category <span className="text-destructive">*</span></Label>
                    <Select value={locationCategory} onValueChange={(val) => setLocationCategory(val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Medium of Instruction <span className="text-destructive">*</span></Label>
                    <Select value={medium} onValueChange={(val) => setMedium(val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIUMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs font-semibold text-muted-foreground mb-2 m-0">School Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Input value={streetArea} onChange={e => setStreetArea(e.target.value)} placeholder="Street / Area" />
                  <Input value={villageTown} onChange={e => setVillageTown(e.target.value)} placeholder="Village / Town" />
                  <Input value={talukaTehsil} onChange={e => setTalukaTehsil(e.target.value)} placeholder="Taluka / Tehsil" />
                  <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} />
                  <Select value={state} onValueChange={val => { setState(val ?? ""); setDistrict(""); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select State/UT..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="PIN Code (6 digits)" />
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Input value={principalName} onChange={e => setPrincipalName(e.target.value)} placeholder="Principal Name" />
              <Input value={principalMobile} onChange={e => setPrincipalMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Principal Mobile (10 digits)" />
              <Input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} placeholder="School Coordinator / Science Teacher Name" />
              <Input value={coordinatorMobile} onChange={e => setCoordinatorMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Coordinator Contact (10 digits)" />
            </div>

            {/* Section 2: Visit Details */}
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">2. Visit Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Visit Date</Label>
                <Input value={visitDate} onChange={e => setVisitDate(e.target.value)} type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Number of Volunteers Present</Label>
                <Input value={volunteersPresent} onChange={e => setVolunteersPresent(e.target.value ? String(Math.min(50, Number(e.target.value))) : "")} type="number" min="0" max="50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Arrival Time</Label>
                <Input value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} type="time" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Departure Time</Label>
                <Input value={departureTime} onChange={e => setDepartureTime(e.target.value)} type="time" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Total Duration in School: <strong>{autoDuration !== null ? `${autoDuration} minutes` : "—"}</strong>
            </p>
            <div className="mb-6 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Volunteer Names</Label>
              {loadingGroup ? (
                <p className="text-xs text-muted-foreground">Loading group members...</p>
              ) : members.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members found for this group.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map(m => (
                    <Label key={m.id} className="flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1.5 cursor-pointer text-xs">
                      <Checkbox checked={volunteerNames.includes(m.name)} onCheckedChange={() => toggleVolunteer(m.name)} />
                      {m.name}
                    </Label>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Session Details */}
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 m-0">3. Session Details</h2>
            <p className="text-xs text-muted-foreground mb-3">Add one row for each session conducted.</p>
            <div className="space-y-4 mb-3">
              {sessions.map((s, i) => {
                const inheritedFromCombined = i > 0 && !!sessions[i - 1].combined_session;
                return (
                <div key={i} className="border border-border rounded-lg p-4 relative space-y-3">
                  {sessions.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSessions(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
                      <X size={16} />
                    </Button>
                  )}
                  <p className="text-[11px] font-bold text-muted-foreground m-0">Session {i + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={s.standard} onValueChange={val => updateSession(i, "standard", val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Standard / Class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARDS.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={s.division ?? ""} onChange={e => updateSession(i, "division", e.target.value)} placeholder="Division" />
                    <Input value={s.num_students ?? ""} onChange={e => updateSession(i, "num_students", e.target.value ? Math.min(500, Number(e.target.value)) : "")} type="number" min="0" max="500" placeholder="No. of Students" />
                    {!inheritedFromCombined && (
                      <>
                        <Select value={s.theme_topic ?? ""} onValueChange={val => updateSession(i, "theme_topic", val ?? "")}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Theme / Topic..." />
                          </SelectTrigger>
                          <SelectContent>
                            {THEMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input value={s.duration_minutes ?? ""} onChange={e => updateSession(i, "duration_minutes", e.target.value ? Math.min(480, Number(e.target.value)) : "")} type="number" min="0" max="480" placeholder="Duration (Minutes)" />
                        <Select value={s.language_used ?? ""} onValueChange={val => updateSession(i, "language_used", val ?? "")}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Language Used..." />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  {inheritedFromCombined && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Theme / Topic, Duration and Language carried over from the combined session above.
                    </p>
                  )}
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                    <Checkbox checked={!!s.combined_session} onCheckedChange={c => updateSession(i, "combined_session", !!c)} />
                    Combined session (conducted for all students together)
                  </Label>
                </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="link"
              onClick={() => setSessions(prev => {
                const last = prev[prev.length - 1];
                const next: SchoolReportSession = last?.combined_session
                  ? { ...EMPTY_SESSION, theme_topic: last.theme_topic, duration_minutes: last.duration_minutes, language_used: last.language_used }
                  : { ...EMPTY_SESSION };
                return [...prev, next];
              })}
              className="flex items-center gap-1.5 h-auto p-0 text-xs text-accent font-semibold mb-6"
            >
              <Plus size={14} /> Add another session
            </Button>

            {/* Section 4: Reflection & Observations */}
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 m-0">4. Reflection & Observations</h2>
            <p className="text-xs text-muted-foreground mb-4">Minimum 50 words each (required to submit final)</p>
            <div className="space-y-4 mb-6">
              {OBSERVATION_FIELDS.map(f => {
                const text = observations[f.key] ?? "";
                const wc = wordCount(text);
                return (
                  <div key={f.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground">{f.label} <span className="text-destructive">*</span></Label>
                      <span className={`text-[11px] ${wc >= 50 ? "text-emerald-600" : "text-muted-foreground"}`}>{wc} / 50 words</span>
                    </div>
                    <Textarea
                      value={text}
                      onChange={e => setObservations(o => ({ ...o, [f.key]: e.target.value }))}
                      rows={4}
                      placeholder="Minimum 50 words..."
                    />
                  </div>
                );
              })}
            </div>

            {/* Section 5: Visit Summary */}
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">5. Visit Summary</h2>
            <div className="space-y-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Overall Visit Rating</Label>
                <Select value={rating} onValueChange={(val) => setRating(val ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Follow-up Visit Required</Label>
                  <Select value={followUpRequired} onValueChange={(val) => setFollowUpRequired(val ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {followUpRequired === "yes" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Suggested Date for Follow-up</Label>
                    <Input value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} type="date" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Additional Remarks</Label>
                <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Anything else to add..." />
              </div>
            </div>

            <Label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mt-5">
              <Checkbox checked={asFinal} onCheckedChange={c => setAsFinal(!!c)} />
              Submit as final (otherwise saved as draft)
            </Label>
            <Button type="submit" disabled={saving} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saving ? "Submitting..." : asFinal ? "Submit Final Report" : "Save Draft"}
            </Button>
          </form>
</CardContent>
</Card>
        )}

        {groupId && (
          loadingGroup ? (
            <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>Loading...</p>
          ) : reports.length === 0 ? (
            <Card>
<CardContent className="text-center">
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
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 8px" }}>{formatDate(r.created_at)}</p>
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
