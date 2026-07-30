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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FBF7EC", color: "#19140F", boxSizing: "border-box",
};

function F({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: hint ? 2 : 6 }}>
        {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 11, color: "#9B9188", margin: "0 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

function durationHours(duration: string): number {
  return Number(duration.replace(/[^0-9.]/g, "")) || 0;
}

export function SchoolProfileForm({ onSaved }: { onSaved?: () => void }) {
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
  const [contactNumber, setContactNumber] = useState("");
  const [rows, setRows] = useState<StrengthRow[]>([{ ...EMPTY_ROW }]);
  const [numTeachers, setNumTeachers] = useState("");
  const [locationType, setLocationType] = useState("");
  const [medium, setMedium] = useState("");
  const [duration, setDuration] = useState("");
  const [numSessions, setNumSessions] = useState("");

  const totalStudents = rows.reduce((sum, r) => sum + (Number(r.boys) || 0) + (Number(r.girls) || 0), 0);
  const totalInputHours = duration && numSessions ? durationHours(duration) * Number(numSessions) : 0;

  function updateRow(i: number, field: keyof StrengthRow, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: field === "standard" ? value : (value ? Math.max(0, Number(value)) : "") } : r));
  }

  function resetForm() {
    setAcademicYear(""); setProject(""); setSchoolName(""); setState(""); setDistrict("");
    setTalukaBlock(""); setVillageCity(""); setSchoolType(""); setModuleType(""); setMode("");
    setContactNumber(""); setRows([{ ...EMPTY_ROW }]); setNumTeachers(""); setLocationType("");
    setMedium(""); setDuration(""); setNumSessions("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const strengthRows = rows.filter(r => r.standard.trim());
    if (strengthRows.length === 0) {
      const msg = "Add at least one row to Student Strength.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const payload: EarcSchoolProfileInput = {
        academic_year: academicYear as EarcSchoolProfileInput["academic_year"],
        project: project as EarcSchoolProfileInput["project"],
        school_name: schoolName,
        state,
        district,
        taluka_block: talukaBlock,
        village_city: villageCity,
        school_type: schoolType as EarcSchoolProfileInput["school_type"],
        module: moduleType as EarcSchoolProfileInput["module"],
        mode: mode as EarcSchoolProfileInput["mode"],
        contact_number: contactNumber || undefined,
        student_strength: strengthRows.map(r => ({ standard: r.standard, boys: Number(r.boys) || 0, girls: Number(r.girls) || 0 })),
        num_teachers_involved: Number(numTeachers) || 0,
        location_type: locationType as EarcSchoolProfileInput["location_type"],
        medium_of_instruction: medium as EarcSchoolProfileInput["medium_of_instruction"],
        duration_per_session: duration as EarcSchoolProfileInput["duration_per_session"],
        num_sessions_conducted: Number(numSessions) || 0,
      };
      await createSchoolProfile(payload);
      toast.success("School profile saved");
      resetForm();
      router.refresh();
      onSaved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save school profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Academic Year" required>
          <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} required style={inputStyle}>
            <option value="">Select academic year...</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </F>
        <F label="Project" required>
          <select value={project} onChange={e => setProject(e.target.value)} required style={inputStyle}>
            <option value="">Select project...</option>
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </F>
      </div>

      <div className="mb-4">
        <F label="School Name" required>
          <input value={schoolName} onChange={e => setSchoolName(e.target.value)} required placeholder="Enter full school name" style={inputStyle} />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="State" required>
          <select value={state} onChange={e => { setState(e.target.value); setDistrict(""); }} required style={{ ...inputStyle, appearance: "none" }}>
            <option value="">Select state...</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F label="District" required>
          <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} required style={inputStyle} />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Taluka / Block" required>
          <input value={talukaBlock} onChange={e => setTalukaBlock(e.target.value)} required placeholder="Enter taluka / block" style={inputStyle} />
        </F>
        <F label="Village / City" required>
          <input value={villageCity} onChange={e => setVillageCity(e.target.value)} required placeholder="Enter village or city name" style={inputStyle} />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Type of School" required>
          <select value={schoolType} onChange={e => setSchoolType(e.target.value)} required style={inputStyle}>
            <option value="">Select type...</option>
            {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </F>
        <F label="Module" required>
          <select value={moduleType} onChange={e => setModuleType(e.target.value)} required style={inputStyle}>
            <option value="">Select module...</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Mode" required>
          <select value={mode} onChange={e => setMode(e.target.value)} required style={inputStyle}>
            <option value="">Select mode...</option>
            {MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </F>
        <F label="School Contact Number" hint="10-digit mobile/landline, optional">
          <input
            value={contactNumber}
            onChange={e => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
            placeholder="10-digit number" style={inputStyle}
          />
        </F>
      </div>

      <div className="mb-4">
        <F label="Student Strength" required hint="Add one row per standard">
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center" style={{ border: "1px solid #E4DFD1", borderRadius: 6, padding: 8, position: "relative" }}>
                <select value={r.standard} onChange={e => updateRow(i, "standard", e.target.value)} style={inputStyle}>
                  <option value="">Select std...</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={r.boys} onChange={e => updateRow(i, "boys", e.target.value)} type="number" min="0" placeholder="Boys" style={inputStyle} />
                <input value={r.girls} onChange={e => updateRow(i, "girls", e.target.value)} type="number" min="0" placeholder="Girls" style={inputStyle} />
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "#5A5247" }}>Total: <strong>{(Number(r.boys) || 0) + (Number(r.girls) || 0)}</strong></span>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9B9188" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setRows(prev => [...prev, { ...EMPTY_ROW }])} className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#4A55BE", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
            <Plus size={14} /> Add another standard
          </button>
          <p style={{ fontSize: 12, color: "#5A5247", marginTop: 8 }}>Total Students (auto-calculated): <strong>{totalStudents}</strong></p>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Number of Teachers Involved" required>
          <input value={numTeachers} onChange={e => setNumTeachers(e.target.value)} type="number" min="0" required placeholder="Enter number" style={inputStyle} />
        </F>
        <F label="Location Type" required>
          <select value={locationType} onChange={e => setLocationType(e.target.value)} required style={inputStyle}>
            <option value="">Select location type...</option>
            {LOCATION_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Medium of Instruction" required>
          <select value={medium} onChange={e => setMedium(e.target.value)} required style={inputStyle}>
            <option value="">Select medium...</option>
            {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </F>
        <F label="Duration per Session" required>
          <select value={duration} onChange={e => setDuration(e.target.value)} required style={inputStyle}>
            <option value="">Select duration...</option>
            {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <F label="Number of Sessions Conducted" required>
          <input value={numSessions} onChange={e => setNumSessions(e.target.value)} type="number" min="0" required placeholder="Total sessions held" style={inputStyle} />
        </F>
        <F label="Total Input Hours" hint="Auto-calculated = Duration × Sessions">
          <input value={totalInputHours} disabled style={{ ...inputStyle, color: "#9B9188" }} />
        </F>
      </div>

      <button type="submit" disabled={saving} style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Submit School Profile"}
      </button>
    </form>
  );
}
