"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStudentProfile } from "@/actions/earc";
import type { EarcStudentProfileInput } from "@/lib/validations";
import { BLOOD_GROUPS, STANDARDS } from "@/lib/constants/earc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GENDERS = ["Male", "Female", "Other"] as const;

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
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <F label="First Name" required>
          <Input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Enter first name" />
        </F>
        <F label="Middle Name">
          <Input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Enter middle name" />
        </F>
        <F label="Last Name" required>
          <Input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Enter last name" />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Mobile Number" hint="Optional, 10 digits">
          <Input
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
            placeholder="10-digit mobile number"
          />
        </F>
        <F label="Date of Birth">
          <Input value={dob} onChange={e => setDob(e.target.value)} type="date" />
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Gender" required>
          <Select value={gender || undefined} onValueChange={v => setGender(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select gender..." /></SelectTrigger>
            <SelectContent>
              {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
        <F label="Blood Group" hint="Optional">
          <Select value={bloodGroup || undefined} onValueChange={v => setBloodGroup(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select blood group..." /></SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <F label="Standard" required>
          <Select value={standard || undefined} onValueChange={v => setStandard(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select standard..." /></SelectTrigger>
            <SelectContent>
              {STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <F label="APAAR ID" hint="Optional">
          <Input value={apaarId} onChange={e => setApaarId(e.target.value)} placeholder="Enter APAAR ID" />
        </F>
        <F label="Aadhaar Number" hint="Optional">
          <Input
            value={aadhaarNumber}
            onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            inputMode="numeric" pattern="[0-9]*" maxLength={12}
            placeholder="Enter Aadhaar number"
          />
        </F>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Submit Student Profile"}
      </Button>
    </form>
</CardContent>
</Card>
  );
}
