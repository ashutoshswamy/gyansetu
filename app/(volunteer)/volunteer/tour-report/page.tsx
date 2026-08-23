"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyTourReports, submitTourReport } from "@/actions/tour-reports";
import { getMyToursForSelect } from "@/actions/tours";
import { FileBarChart, Plus, X } from "lucide-react";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";
import type { TourReport, TourReportHost, TourReportLogisticsScores } from "@/types";
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

type TourReportRow = TourReport & { tour?: { id: string; title: string } | null };

const statusColors: Record<string, { color: string; bg: string }> = {
  draft:     { color: "var(--gs-muted)", bg: "rgba(var(--gs-muted-rgb), 0.10)" },
  submitted: { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  approved:  { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
};

const EMPTY_HOST: TourReportHost = { organisation: "", contact_person_name: "", designation: "", mobile_number: "", state: "", district: "", block_taluk: "", village_city: "" };

const LOGISTICS_FIELDS: { key: keyof TourReportLogisticsScores; label: string }[] = [
  { key: "accommodation", label: "Accommodation" },
  { key: "food", label: "Food & Refreshments" },
  { key: "local_transport", label: "Local Transport" },
  { key: "coordination_communication", label: "Coordination & Communication" },
  { key: "safety_security", label: "Safety & Security" },
  { key: "overall_experience", label: "Overall Location Experience" },
];

const OBSERVATION_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "unique_features", label: "Unique Features of the Location", required: true },
  { key: "best_practices", label: "Best Practices Implemented", required: true },
  { key: "cultural_observations", label: "Cultural & Social Observations", required: true },
  { key: "challenges_faced", label: "Key Challenges Faced", required: true },
  { key: "suggestions_future_teams", label: "Suggestions for Future Teams", required: true },
  { key: "important_contacts", label: "Important Local Contacts (Optional)", required: false },
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
        <Button
          key={n}
          type="button"
          size="icon-sm"
          onClick={() => onChange(n)}
          className={
            value === n
              ? "rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              : "rounded bg-background border-border text-muted-foreground hover:border-foreground text-xs font-semibold"
          }
          variant={value === n ? undefined : "outline"}
        >
          {n}
        </Button>
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
      getMyToursForSelect(),
    ]).then(([reportsData, toursData]) => {
      setReports(reportsData);
      setTours(toursData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function updateHost(i: number, field: keyof TourReportHost, value: string) {
    setHosts(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  }

  function resetForm() {
    setTourId(""); setLocationName(""); setHosts([{ ...EMPTY_HOST }]); setScores({});
    setObservations({}); setRecommendation(""); setSuitableResidential(""); setFollowUpRequired("");
    setRemarks(""); setAsFinal(false);
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!tourId) { fail("Select a tour."); return; }
    if (!locationName.trim()) { fail("Location is required."); return; }

    if (asFinal) {
      for (const f of OBSERVATION_FIELDS) {
        if (!f.required) continue;
        const wc = wordCount(observations[f.key] ?? "");
        if (wc < 50) { fail(`"${f.label}" must be at least 50 words (currently ${wc}).`); return; }
      }
      for (const f of LOGISTICS_FIELDS) {
        if (!scores[f.key]) { fail(`Please rate "${f.label}".`); return; }
      }
      if (!recommendation) { fail("Select an overall recommendation."); return; }
      if (!suitableResidential) { fail("Select whether the location suits residential camps."); return; }
      if (!followUpRequired) { fail("Select whether follow-up is required."); return; }
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
      fail(err instanceof Error ? err.message : "Failed to submit tour report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Volunteer Portal</p>
          <h1 className="text-2xl font-bold text-foreground m-0">Tour Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Location report — fill one for each location visited</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Section 1: Location Details */}
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">1. Location Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Tour <span className="text-destructive">*</span></Label>
                  <Select value={tourId} onValueChange={(val) => setTourId(val ?? "")} items={tours.map(t => ({ value: t.id, label: t.title }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tour..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Location Visited <span className="text-destructive">*</span></Label>
                  <Input value={locationName} onChange={e => setLocationName(e.target.value)} required placeholder="e.g. Village / town name" />
                </div>
              </div>

              {/* Section 2: Local Organisations & Host Details */}
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">2. Local Organisations & Host Details</h2>
              <div className="space-y-4 mb-3">
                {hosts.map((h, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 relative">
                    {hosts.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setHosts(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
                        <X size={16} />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input value={h.organisation} onChange={e => updateHost(i, "organisation", e.target.value)} placeholder="Organisation" />
                      <Input value={h.contact_person_name} onChange={e => updateHost(i, "contact_person_name", e.target.value)} placeholder="Contact Person Name" />
                      <Input value={h.designation} onChange={e => updateHost(i, "designation", e.target.value)} placeholder="Designation" />
                      <Input value={h.mobile_number} onChange={e => updateHost(i, "mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Mobile Number (10 digits)" />
                      <Select value={h.state} onValueChange={v => { updateHost(i, "state", v ?? ""); updateHost(i, "district", ""); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select State/UT..." />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <DistrictSelect key={h.state} state={h.state} value={h.district} onChange={v => updateHost(i, "district", v)} />
                      <Input value={h.block_taluk} onChange={e => updateHost(i, "block_taluk", e.target.value)} placeholder="Block / Taluk (if possible)" />
                      <Input value={h.village_city} onChange={e => updateHost(i, "village_city", e.target.value)} placeholder="Village / City" />
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="link" onClick={() => setHosts(prev => [...prev, { ...EMPTY_HOST }])} className="flex items-center gap-1.5 h-auto p-0 text-xs text-accent font-semibold mb-6">
                <Plus size={14} /> Add another host / organisation
              </Button>

              {/* Section 3: Logistics Rating */}
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 m-0">3. Logistics Rating</h2>
              <p className="text-xs text-muted-foreground mb-4">Rate each parameter from 1 (Poor) to 10 (Excellent)</p>
              <div className="space-y-3 mb-6">
                {LOGISTICS_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center justify-between gap-4 flex-wrap">
                    <Label className="text-xs font-semibold text-muted-foreground min-w-[200px]">{f.label}</Label>
                    <RatingScale value={scores[f.key] ?? 0} onChange={v => setScores(s => ({ ...s, [f.key]: v }))} />
                  </div>
                ))}
              </div>

              {/* Section 4: Observations */}
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 m-0">4. Observations</h2>
              <p className="text-xs text-muted-foreground mb-4">Minimum 50 words each (except where marked optional)</p>
              <div className="space-y-4 mb-6">
                {OBSERVATION_FIELDS.map(f => {
                  const text = observations[f.key] ?? "";
                  const wc = wordCount(text);
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          {f.label} {f.required && <span className="text-destructive">*</span>}
                        </Label>
                        {f.required && (
                          <span className={`text-[11px] ${wc >= 50 ? "text-emerald-600" : "text-muted-foreground"}`}>{wc} / 50 words</span>
                        )}
                      </div>
                      <Textarea
                        value={text}
                        onChange={e => setObservations(o => ({ ...o, [f.key]: e.target.value }))}
                        rows={4}
                        placeholder={f.required ? "Minimum 50 words..." : "Optional..."}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Section 5: Visit Summary */}
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 m-0">5. Visit Summary</h2>
              <div className="space-y-4 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Overall Recommendation</Label>
                  <Select value={recommendation} onValueChange={(val) => setRecommendation(val ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Suitable for Residential Camps</Label>
                    <Select value={suitableResidential} onValueChange={(val) => setSuitableResidential(val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Follow-up Required</Label>
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
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Additional Remarks</Label>
                  <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Anything else to add..." />
                </div>
              </div>

              <Label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mt-5">
                <Checkbox checked={asFinal} onCheckedChange={(c) => setAsFinal(!!c)} />
                Submit as final (otherwise saved as draft)
              </Label>
              <Button type="submit" disabled={saving} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {saving ? "Submitting..." : asFinal ? "Submit Final Report" : "Save Draft"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>Loading...</p>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="text-center pt-6">
              <FileBarChart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No tour reports yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const s = statusColors[r.status] ?? statusColors.draft;
              return (
                <Card key={r.id}>
<CardContent>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{r.location_name}</span>
                    <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>{r.tour?.title ?? "Unknown tour"}</span>
                    <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>
                      {r.status}
                    </Badge>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 8px" }}>{formatDate(r.created_at)}</p>
                  {r.overall_recommendation && (
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>Recommendation: <strong>{r.overall_recommendation}</strong></p>
                  )}
                </CardContent>
</Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
