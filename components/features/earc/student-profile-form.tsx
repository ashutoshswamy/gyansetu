"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStudentProfile } from "@/actions/earc";
import type { EarcStudentProfileInput } from "@/lib/validations";
import { BLOOD_GROUPS, STANDARDS } from "@/lib/constants/earc";
import { Card, CardContent } from "@/components/ui/card";

const GENDERS = ["Male", "Female", "Other"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
  background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
};

function F({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: hint ? 2 : 6 }}>
        {label}{required && <span style={{ color: "var(--gs-danger)", marginLeft: 2 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "0 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

export function StudentProfileForm({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [standard, setStandard] = useState("");
  const [apaarId, setApaarId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");

  function resetForm() {
    setFirstName(""); setMiddleName(""); setLastName(""); setMobileNumber("");
    setDob(""); setGender(""); setBloodGroup(""); setStandard(""); setApaarId(""); setAadhaarNumber("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: EarcStudentProfileInput = {
        first_name: firstName,
        middle_name: middleName || undefined,
        last_name: lastName,
        mobile_number: mobileNumber || undefined,
        date_of_birth: dob || undefined,
        gender: gender as EarcStudentProfileInput["gender"],
        blood_group: (bloodGroup || undefined) as EarcStudentProfileInput["blood_group"],
        standard: standard as EarcStudentProfileInput["standard"],
        apaar_id: apaarId || undefined,
        aadhaar_number: aadhaarNumber || undefined,
      };
      await createStudentProfile(payload);
      toast.success("Student profile saved");
      resetForm();
      router.refresh();
      onSaved?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save student profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
<CardContent>
<form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <F label="First Name" required>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Enter first name" style={inputStyle} />
        </F>
        <F label="Middle Name">
          <input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Enter middle name" style={inputStyle} />
        </F>
        <F label="Last Name" required>
          <input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Enter last name" style={inputStyle} />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Mobile Number" hint="Optional, 10 digits">
          <input
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
            placeholder="10-digit mobile number" style={inputStyle}
          />
        </F>
        <F label="Date of Birth">
          <input value={dob} onChange={e => setDob(e.target.value)} type="date" style={inputStyle} />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Gender" required>
          <select value={gender} onChange={e => setGender(e.target.value)} required style={inputStyle}>
            <option value="">Select gender...</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </F>
        <F label="Blood Group" hint="Optional">
          <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={inputStyle}>
            <option value="">Select blood group...</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Standard" required>
          <select value={standard} onChange={e => setStandard(e.target.value)} required style={inputStyle}>
            <option value="">Select standard...</option>
            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <F label="APAAR ID" hint="Optional">
          <input value={apaarId} onChange={e => setApaarId(e.target.value)} placeholder="Enter APAAR ID" style={inputStyle} />
        </F>
        <F label="Aadhaar Number" hint="Optional">
          <input
            value={aadhaarNumber}
            onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            inputMode="numeric" pattern="[0-9]*" maxLength={12}
            placeholder="Enter Aadhaar number" style={inputStyle}
          />
        </F>
      </div>

      <button type="submit" disabled={saving} style={{ background: "var(--gs-success)", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Submit Student Profile"}
      </button>
    </form>
</CardContent>
</Card>
  );
}
