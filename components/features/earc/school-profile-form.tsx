"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { createSchoolProfile } from "@/actions/earc";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";
import type { EarcSchoolProfileInput } from "@/lib/validations";
import { STANDARDS } from "@/lib/constants/earc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27", "2027-28", "2028-29", "2029-30"] as const;
const PROJECTS = ["Chhote Scientists", "Vikas Mitra", "Pradnya Vikas", "Anubha Shala", "LearEng", "Padhai Se Dosti", "Others"] as const;
const SCHOOL_TYPES = ["Government", "Private", "Ashram School", "Other"] as const;
const MODULES = ["Facilitator", "Teacher Training"] as const;
const MODES = ["Online", "Offline"] as const;
const LOCATION_TYPES = ["Urban", "Rural", "Tribal", "Semi-Urban"] as const;
const MEDIUMS = ["English", "Marathi", "Hindi", "Other"] as const;
const DURATIONS = ["0.5 hr", "1 hr", "1.5 hrs", "2 hrs", "2.5 hrs", "3 hrs"] as const;

type StrengthRow = { standard: string; boys: number | ""; girls: number | "" };
const EMPTY_ROW: StrengthRow = { standard: "", boys: "", girls: "" };

function F({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function SchoolProfileForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [academicYear, setAcademicYear] = useState("");
  const [project, setProject] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [talukaBlock, setTalukaBlock] = useState("");
  const [villageCity, setVillageCity] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [moduleType, setModuleType] = useState("");
  const [mode, setMode] = useState("");
  const [locationType, setLocationType] = useState("");
  const [medium, setMedium] = useState("");
  const [duration, setDuration] = useState("");
  const [sessionCount, setSessionCount] = useState<number | "">("");
  const [contactNumber, setContactNumber] = useState("");

  const [rows, setRows] = useState<StrengthRow[]>([{ ...EMPTY_ROW }]);

  function updateRow(i: number, field: keyof StrengthRow, value: string | number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter(r => r.standard && (r.boys !== "" || r.girls !== ""));
    if (validRows.length === 0) {
      const msg = "Add at least one standard with student strength (boys and/or girls).";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    const payload: EarcSchoolProfileInput = {
      academic_year: academicYear as EarcSchoolProfileInput["academic_year"],
      project: project as EarcSchoolProfileInput["project"],
      school_name: schoolName.trim(),
      state,
      district,
      taluka_block: talukaBlock.trim(),
      village_city: villageCity.trim(),
      school_type: schoolType as EarcSchoolProfileInput["school_type"],
      module: moduleType as EarcSchoolProfileInput["module"],
      mode: mode as EarcSchoolProfileInput["mode"],
      location_type: (locationType || undefined) as EarcSchoolProfileInput["location_type"],
      medium_of_instruction: (medium || undefined) as EarcSchoolProfileInput["medium_of_instruction"],
      duration_per_session: (duration || undefined) as EarcSchoolProfileInput["duration_per_session"],
      num_sessions_conducted: sessionCount !== "" ? Number(sessionCount) : 0,
      contact_number: contactNumber || undefined,
      student_strength: validRows.map(r => ({
        standard: r.standard,
        boys: r.boys === "" ? 0 : Number(r.boys),
        girls: r.girls === "" ? 0 : Number(r.girls),
      })),
      num_teachers_involved: 0,
    };

    try {
      await createSchoolProfile(payload);
      toast.success("School profile created successfully");
      router.refresh();
      onDone?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create school profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Academic Year" required>
              <Select value={academicYear} onValueChange={(val) => setAcademicYear(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select academic year..." />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="Project" required>
              <Select value={project} onValueChange={(val) => setProject(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
          </div>

          <div className="mb-4">
            <F label="School Name" required>
              <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} required placeholder="Enter full school name" />
            </F>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="State" required>
              <Select value={state} onValueChange={val => { setState(val ?? ""); setDistrict(""); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="District" required>
              <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} required />
            </F>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Taluka / Block" required>
              <Input value={talukaBlock} onChange={e => setTalukaBlock(e.target.value)} required placeholder="Enter taluka / block" />
            </F>
            <F label="Village / City" required>
              <Input value={villageCity} onChange={e => setVillageCity(e.target.value)} required placeholder="Enter village or city name" />
            </F>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Type of School" required>
              <Select value={schoolType} onValueChange={(val) => setSchoolType(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="Module" required>
              <Select value={moduleType} onValueChange={(val) => setModuleType(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select module..." />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Mode" required>
              <Select value={mode} onValueChange={(val) => setMode(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mode..." />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="School Contact Number" hint="10-digit mobile/landline, optional">
              <Input
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                placeholder="10-digit number"
              />
            </F>
          </div>

          <div className="mb-4">
            <F label="Student Strength" required hint="Add one row per standard">
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border border-border rounded-md p-2 relative">
                    <Select value={r.standard} onValueChange={val => updateRow(i, "standard", val ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Standard..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARDS.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min="0" placeholder="Boys count"
                      value={r.boys} onChange={e => updateRow(i, "boys", e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    <Input
                      type="number" min="0" placeholder="Girls count"
                      value={r.girls} onChange={e => updateRow(i, "girls", e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                        className="h-8 w-8 text-muted-foreground justify-self-end sm:justify-self-center"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="link"
                onClick={() => setRows(prev => [...prev, { ...EMPTY_ROW }])}
                className="flex items-center gap-1.5 h-auto p-0 text-xs text-accent font-semibold mt-2"
              >
                <Plus size={14} /> Add another standard
              </Button>
            </F>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <F label="Location Type">
              <Select value={locationType} onValueChange={(val) => setLocationType(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="Medium of Instruction">
              <Select value={medium} onValueChange={(val) => setMedium(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select medium..." />
                </SelectTrigger>
                <SelectContent>
                  {MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="Session Duration">
              <Select value={duration} onValueChange={(val) => setDuration(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {saving ? "Saving..." : "Save School Profile"}
            </Button>
            {onDone && (
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
