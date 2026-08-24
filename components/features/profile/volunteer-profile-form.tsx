"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { upsertVolunteerProfile, getMyVolunteerProfile } from "@/actions/profiles";
import { formatDate } from "@/lib/format-date";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { INDIAN_STATES } from "@/lib/locations";
import { FileUploadField } from "@/components/features/file-upload-field";
import { DistrictSelect } from "@/components/features/forms/district-select";
import type { VolunteerProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't Know"];
const RELATIONS = ["Father", "Mother", "Spouse", "Brother", "Sister", "Friend", "Guardian", "Other"];
const DIETARY = ["Vegetarian", "Vegan", "Jain", "Eggetarian", "Non-Vegetarian", "Gluten-Free", "Lactose-Free", "Diabetic Diet", "Other"];
const STREAMS = ["Engineering", "Science", "Commerce", "Arts", "Medical", "Management", "Law", "Computer Applications", "Agriculture", "Education", "Other"];
const KNOWN_LANGUAGES = ["English", "Marathi", "Hindi"];

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function sanitizeNameInput(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
}

function sanitizeDigitsInput(maxLen: number) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, maxLen);
  };
}

interface Props {
  variant: "enrollee" | "volunteer";
}

export function VolunteerProfileForm({ variant }: Props) {
  const accent = variant === "enrollee" ? "#1E5A8A" : "var(--gs-success)";
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "work" | "emergency" | "declaration">("personal");
  const [dob, setDob] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState("");
  const [sameAddress, setSameAddress] = useState(true);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [hasAllergies, setHasAllergies] = useState(false);
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [takesMedicines, setTakesMedicines] = useState(false);
  const [eduCourseStatus, setEduCourseStatus] = useState("");
  const [collegeState, setCollegeState] = useState("");
  const [collegeCity, setCollegeCity] = useState("");
  const [workState, setWorkState] = useState("");
  const [workCity, setWorkCity] = useState("");
  const [otherLangChecked, setOtherLangChecked] = useState(false);
  const [otherLangValue, setOtherLangValue] = useState("");
  const [permState, setPermState] = useState("");
  const [permCity, setPermCity] = useState("");
  const [district, setDistrict] = useState("");
  const [permDistrict, setPermDistrict] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [qualification, setQualification] = useState("");
  const [stream, setStream] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  useEffect(() => {
    getMyVolunteerProfile().then(d => {
      setProfile(d);
      if (d?.date_of_birth) setDob(d.date_of_birth);
      if (d?.state) setSelectedState(d.state);
      if (d?.city) setSelectedCity(d.city);
      if (d?.district) setDistrict(d.district);
      if (d?.photo_url) setPhotoUrl(d.photo_url);
      if (d?.aadhaar_doc_url) setAadhaarDocUrl(d.aadhaar_doc_url);
      if (d) setSameAddress(d.permanent_address_same ?? true);
      setIsCurrentlyWorking(!!d?.company_name || d?.current_status === "working_professional" || d?.current_status === "both");
      if (d?.edu_course_status) setEduCourseStatus(d.edu_course_status);
      if (d?.gender) setGender(d.gender);
      if (d?.blood_group) setBloodGroup(d.blood_group);
      if (d?.qualification) setQualification(d.qualification);
      if (d?.stream) setStream(d.stream);
      if (d?.emergency_contact_relation) setEmergencyRelation(d.emergency_contact_relation);
      setHasAllergies(d?.has_allergies ?? false);
      setHasMedicalConditions(d?.has_medical_conditions ?? false);
      setTakesMedicines(d?.takes_medicines ?? false);

      // student_location is stored as "City, State" — best-effort split for the dropdowns.
      const locParts = ((d?.student_location as string) ?? "").split(",").map((s: string) => s.trim());
      if (locParts.length === 2 && INDIAN_STATES.includes(locParts[1])) {
        setCollegeState(locParts[1]);
        setCollegeCity(locParts[0]);
      }

      // work_location is stored as "City, State" — best-effort split for the dropdowns.
      const workParts = ((d?.work_location as string) ?? "").split(",").map((s: string) => s.trim());
      if (workParts.length === 2 && INDIAN_STATES.includes(workParts[1])) {
        setWorkState(workParts[1]);
        setWorkCity(workParts[0]);
      }

      const langs: string[] = d?.languages ?? [];
      const extra = langs.filter((l: string) => !KNOWN_LANGUAGES.includes(l));
      if (extra.length) { setOtherLangChecked(true); setOtherLangValue(extra.join(", ")); }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function csvToArray(val: string | null) { return (val ?? "").split(",").map(s => s.trim()).filter(Boolean); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const invalid = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(":invalid");
    if (invalid) {
      const tab = invalid.closest<HTMLElement>("[data-tab]")?.dataset.tab as typeof activeTab | undefined;
      if (tab && tab !== activeTab) setActiveTab(tab);
      const fieldLabel = invalid.closest("div")?.querySelector("label")?.textContent?.replace("*", "").trim() || invalid.name || "a field";
      const msg = `Please fill in "${fieldLabel}" — required field.`;
      setError(msg);
      toast.error(msg);
      requestAnimationFrame(() => {
        invalid.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid.focus();
        invalid.reportValidity();
      });
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const str = (name: string) => (fd.get(name) as string) || undefined;

    const bioText = (fd.get("bio") as string) || "";
    const bioWordCount = bioText.trim().split(/\s+/).filter(Boolean).length;
    if (bioWordCount > 100) {
      const msg = `Bio must be at most 100 words (currently ${bioWordCount}).`;
      setError(msg);
      toast.error(msg);
      setSaving(false);
      return;
    }

    const checkedLangs = fd.getAll("languages") as string[];
    const otherLangs = csvToArray(fd.get("languages_other") as string);

    const permHouseNo = str("perm_house_no");
    const permStreet = str("perm_street");
    const permPincode = str("perm_pincode");
    const permanentAddressCombined = [
      permHouseNo, permStreet, permCity, permDistrict, permState, permPincode ? `- ${permPincode}` : undefined,
    ].filter(Boolean).join(", ");

    try {
      const p = await upsertVolunteerProfile({
        first_name: str("first_name"),
        middle_name: str("middle_name"),
        last_name: str("last_name"),
        gender: gender || undefined,
        date_of_birth: str("date_of_birth"),
        blood_group: bloodGroup || undefined,
        aadhaar_number: str("aadhaar_number"),
        aadhaar_doc_url: aadhaarDocUrl || undefined,
        photo_url: photoUrl || undefined,
        phone: str("phone"),
        alternate_phone: str("alternate_phone"),
        house_no: str("house_no"),
        street: str("street"),
        state: selectedState || undefined,
        city: selectedCity || undefined,
        district: district || undefined,
        pincode: str("pincode"),
        address: str("address"),
        permanent_address_same: sameAddress,
        permanent_address: sameAddress ? undefined : (permanentAddressCombined || undefined),

        current_status: isCurrentlyWorking ? "both" : "student",
        institution: str("institution"),
        student_location: collegeCity && collegeState ? `${collegeCity}, ${collegeState}` : undefined,
        qualification: qualification || undefined,
        course_name: str("course_name"),
        stream: stream || undefined,
        edu_course_status: eduCourseStatus as "pursuing" | "completed" | undefined,
        course_year: eduCourseStatus === "completed" ? undefined : str("course_year"),
        company_name: str("company_name"),
        work_location: workCity && workState ? `${workCity}, ${workState}` : undefined,
        designation: str("designation"),
        work_department: str("work_department"),
        years_experience: fd.get("years_experience") ? Number(fd.get("years_experience")) : undefined,

        bio: str("bio"),
        skills: csvToArray(fd.get("skills") as string),
        languages: [...checkedLangs, ...otherLangs],
        states_visited: fd.getAll("states_visited") as string[],
        availability_notes: str("availability_notes"),

        emergency_contact_name: str("emergency_contact_name"),
        emergency_contact_phone: str("emergency_contact_phone"),
        emergency_contact_relation: emergencyRelation || undefined,
        emergency_contact_address: str("emergency_contact_address"),
        has_allergies: hasAllergies,
        allergies_detail: hasAllergies ? str("allergies_detail") : undefined,
        has_medical_conditions: hasMedicalConditions,
        medical_conditions_detail: hasMedicalConditions ? str("medical_conditions_detail") : undefined,
        takes_medicines: takesMedicines,
        medicines_detail: takesMedicines ? str("medicines_detail") : undefined,
        dietary_restrictions: fd.getAll("dietary_restrictions") as string[],
        medical_notes: str("medical_notes"),

        certified_true: fd.get("certified_true") === "on",
        signature_name: str("signature_name"),
        consent_given: fd.get("consent_given") === "on",
      });
      setProfile(p);
      if (p?.date_of_birth) setDob(p.date_of_birth);
      setSaved(true);
      toast.success("Profile saved successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8" style={{ color: "var(--gs-muted)" }}>Loading...</div>;

  const age = dob ? getAge(dob) : null;
  const underAge = variant === "enrollee" && age !== null && age < 18;

  const tabs = [
    { id: "personal" as const, label: "Personal Info" },
    { id: "education" as const, label: "Education" },
    { id: "work" as const, label: "Work" },
    { id: "emergency" as const, label: "Emergency & Medical" },
    { id: "declaration" as const, label: "Declaration" },
  ];

  return (
    <div className="min-h-screen p-4 pb-32 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            {variant === "enrollee" ? "Enrollee Portal" : "Volunteer Portal"}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>My Profile</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            {variant === "enrollee" ? "Your profile is retained if you are promoted to volunteer." : "Volunteer database entry, skills, and emergency contacts."}
          </p>
        </div>

        {variant === "enrollee" && (
          <div style={{ background: "rgba(var(--gs-accent-rgb), 0.06)", border: "1px solid rgba(var(--gs-accent-rgb), 0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--gs-accent)" }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>You must be <strong>18 or older</strong> to apply for a tour. Set your date of birth to enable tour applications.</span>
          </div>
        )}

        {underAge && (
          <div style={{ background: "rgba(var(--gs-danger-alt-rgb), 0.06)", border: "1px solid rgba(var(--gs-danger-alt-rgb), 0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--gs-danger-alt)" }}>
            <AlertCircle size={15} />
            Your age ({age}) does not meet the minimum requirement of 18 to apply for tours.
          </div>
        )}

        {variant === "enrollee" && age !== null && !underAge && (
          <div style={{ background: "rgba(var(--gs-success-rgb), 0.07)", border: "1px solid rgba(var(--gs-success-rgb), 0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gs-success)" }}>
            <CheckCircle size={15} />
            Age verified ({age} years) — you are eligible to apply for tours.
          </div>
        )}

        {variant === "volunteer" && profile?.consent_given && (
          <div style={{ background: "rgba(var(--gs-success-rgb), 0.07)", border: "1px solid rgba(var(--gs-success-rgb), 0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gs-success)" }}>
            <CheckCircle size={15} />
            Consent given on {profile.consent_given_at ? formatDate(profile.consent_given_at) : "-"}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 4, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <Button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              variant={activeTab === t.id ? undefined : "ghost"}
              className="flex-1 min-w-[120px]"
              style={{ background: activeTab === t.id ? accent : "transparent", color: activeTab === t.id ? "white" : "var(--gs-text-secondary)" }}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <Card>
<CardContent>
<form onSubmit={handleSubmit} noValidate>
          {error && (
            <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {saved && (
            <div style={{ background: "rgba(var(--gs-success-rgb), 0.07)", border: "1px solid rgba(var(--gs-success-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-success)", display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle size={14} /> Profile saved.
            </div>
          )}

          <div className="space-y-5" data-tab="personal" style={{ display: activeTab === "personal" ? undefined : "none" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="First Name" required><Input name="first_name" required placeholder="Enter first name" onInput={sanitizeNameInput} defaultValue={(profile?.first_name ?? "").toUpperCase()} style={{ textTransform: "uppercase" }} /></F>
                <F label="Middle Name"><Input name="middle_name" placeholder="Enter middle name" onInput={sanitizeNameInput} defaultValue={(profile?.middle_name ?? "").toUpperCase()} style={{ textTransform: "uppercase" }} /></F>
                <F label="Last Name" required><Input name="last_name" required placeholder="Enter last name" onInput={sanitizeNameInput} defaultValue={(profile?.last_name ?? "").toUpperCase()} style={{ textTransform: "uppercase" }} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Gender" required>
                  <Select required value={gender || undefined} onValueChange={v => setGender(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Date of Birth" required>
                  <Input name="date_of_birth" type="date" required defaultValue={profile?.date_of_birth ?? ""} onChange={e => setDob(e.target.value)} />
                </F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Blood Group" required>
                  <Select required value={bloodGroup || undefined} onValueChange={v => setBloodGroup(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Aadhaar Number" hint="12-digit, numbers only, optional"><Input name="aadhaar_number" inputMode="numeric" pattern="[0-9]*" maxLength={12} placeholder="Enter Aadhaar number" onInput={sanitizeDigitsInput(12)} defaultValue={profile?.aadhaar_number ?? ""} /></F>
              </div>
              <FileUploadField label="Profile Photograph" value={photoUrl} onChange={setPhotoUrl} bucket="media" folder="profile-photos" accept="image/*" showImagePreview required hint="Passport-size, JPG/PNG, max 5 MB. Used on your volunteer ID card." />
              <FileUploadField label="Aadhaar Document" value={aadhaarDocUrl} onChange={setAadhaarDocUrl} bucket="media" folder="aadhaar-docs" accept="image/*,application/pdf" hint="Scan/photo of Aadhaar card (JPG/PNG/PDF, max 5 MB). Required before admin can verify your Aadhaar." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Mobile Number (WhatsApp)" required hint="Exactly 10 digits"><Input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Enter phone number" onInput={sanitizeDigitsInput(10)} defaultValue={profile?.phone ?? ""} /></F>
                <F label="Alternate Mobile Number" hint="Exactly 10 digits"><Input name="alternate_phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Enter alternate phone number" onInput={sanitizeDigitsInput(10)} defaultValue={profile?.alternate_phone ?? ""} /></F>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 10 }}>Current Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="House / Flat No." required><Input name="house_no" required placeholder="Enter house / flat number" defaultValue={profile?.house_no ?? ""} /></F>
                  <F label="Street / Area" required><Input name="street" required placeholder="Enter street / area" defaultValue={profile?.street ?? ""} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="State" required>
                    <Select required value={selectedState || undefined} onValueChange={v => { setSelectedState(v ?? ""); setSelectedCity(""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="Village / City" required>
                    <Input value={selectedCity} onChange={e => setSelectedCity(e.target.value)} placeholder="Your city/village" disabled={!selectedState} />
                  </F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="District" required><DistrictSelect key={selectedState} state={selectedState} value={district} onChange={setDistrict} required /></F>
                  <F label="PIN Code" required hint="6 digits"><Input name="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="Enter pincode" onInput={sanitizeDigitsInput(6)} defaultValue={profile?.pincode ?? ""} /></F>
                </div>
                <F label="Additional Address Notes"><Textarea name="address" rows={2} placeholder="Enter additional address notes" defaultValue={profile?.address ?? ""} style={{ marginTop: 16 }} /></F>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <F label="Permanent Address Same as Current?" required>
                  <div style={{ display: "flex", gap: 20 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input type="radio" name="permanent_address_same" checked={sameAddress} onChange={() => setSameAddress(true)} /> Yes
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input type="radio" name="permanent_address_same" checked={!sameAddress} onChange={() => setSameAddress(false)} /> No
                    </label>
                  </div>
                </F>
                {!sameAddress && (
                  <div style={{ marginTop: 4 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <F label="House / Flat No." required><Input name="perm_house_no" required={!sameAddress} placeholder="Enter house / flat number" /></F>
                      <F label="Street / Area" required><Input name="perm_street" required={!sameAddress} placeholder="Enter street / area" /></F>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                      <F label="State" required>
                        <Select required value={permState || undefined} onValueChange={v => { setPermState(v ?? ""); setPermCity(""); }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </F>
                      <F label="Village / City" required>
                        <Input value={permCity} onChange={e => setPermCity(e.target.value)} placeholder="Your city/village" disabled={!permState} />
                      </F>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                      <F label="District" required><DistrictSelect key={permState} state={permState} value={permDistrict} onChange={setPermDistrict} required={!sameAddress} /></F>
                      <F label="PIN Code" required hint="6 digits"><Input name="perm_pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required={!sameAddress} placeholder="Enter pincode" onInput={sanitizeDigitsInput(6)} /></F>
                    </div>
                  </div>
                )}
              </div>

              <F label="Bio" required hint={`Brief introduction about yourself — maximum 100 words`}><Textarea name="bio" required rows={5} placeholder="Write a short bio" defaultValue={profile?.bio ?? ""} /></F>
              <F label="Skills" required hint="Comma-separated: Teaching, Photography, Music..."><Input name="skills" required placeholder="Enter skills" defaultValue={(profile?.skills ?? []).join(", ")} /></F>
              <F label="Languages Known">
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {KNOWN_LANGUAGES.map(l => (
                    <label key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input type="checkbox" name="languages" value={l} defaultChecked={(profile?.languages ?? []).includes(l)} /> {l}
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <input type="checkbox" checked={otherLangChecked} onChange={e => setOtherLangChecked(e.target.checked)} /> Other
                  </label>
                </div>
                {otherLangChecked && (
                  <Input name="languages_other" placeholder="Specify other language(s), comma-separated" value={otherLangValue} onChange={e => setOtherLangValue(e.target.value)} style={{ marginTop: 8 }} />
                )}
              </F>
              {variant === "volunteer" && (
                <F label="States Visited (previous Gyan Setu)">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {INDIAN_STATES.map(s => (
                      <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gs-text-secondary)", cursor: "pointer" }}>
                        <input type="checkbox" name="states_visited" value={s} defaultChecked={(profile?.states_visited ?? []).includes(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </F>
              )}
              <F label="Availability Notes" required><Textarea name="availability_notes" required rows={2} placeholder="When are you typically available? Any constraints?" defaultValue={profile?.availability_notes ?? ""} /></F>
              <NextSectionButton accent={accent} onClick={() => setActiveTab("education")} />
          </div>

          <div className="space-y-5" data-tab="education" style={{ display: activeTab === "education" ? undefined : "none" }}>
              <F label="College / Institution Name" required><Input name="institution" required placeholder="Enter institution name" defaultValue={profile?.institution ?? ""} /></F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="College State" required>
                  <Select required value={collegeState || undefined} onValueChange={v => { setCollegeState(v ?? ""); setCollegeCity(""); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="College City" required>
                  <Input value={collegeCity} onChange={e => setCollegeCity(e.target.value)} placeholder="Your city" disabled={!collegeState} />
                </F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Qualification" required>
                  <Select required value={qualification || undefined} onValueChange={v => setQualification(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="UG">UG</SelectItem>
                      <SelectItem value="PG">PG</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Course Name" required hint="Example: B.Tech, B.Com, MBA"><Input name="course_name" required placeholder="Enter course name" defaultValue={profile?.course_name ?? ""} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Stream / Specialization" required>
                  <Select required value={stream || undefined} onValueChange={v => setStream(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {STREAMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Course Status" required>
                  <Select required value={eduCourseStatus || undefined} onValueChange={v => setEduCourseStatus(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pursuing">Pursuing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
              </div>
              {eduCourseStatus !== "completed" && (
                <F label="Year / Semester" hint="e.g. 1st Year, Final Semester">
                  <Input name="course_year" placeholder="Enter year / semester" defaultValue={profile?.course_year ?? ""} />
                </F>
              )}
              <NextSectionButton accent={accent} onClick={() => setActiveTab("work")} />
          </div>

          <div className="space-y-5" data-tab="work" style={{ display: activeTab === "work" ? undefined : "none" }}>
              <YesNo label="Are you currently working?" checked={isCurrentlyWorking} onChange={setIsCurrentlyWorking} />

              {isCurrentlyWorking && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 10 }}>Professional Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Company / Organization Name" required><Input name="company_name" required={isCurrentlyWorking} placeholder="Enter company name" defaultValue={profile?.company_name ?? ""} /></F>
                    <F label="Designation" required><Input name="designation" required={isCurrentlyWorking} placeholder="Enter designation" defaultValue={profile?.designation ?? ""} /></F>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                    <F label="Work State" required>
                      <Select required={isCurrentlyWorking} value={workState || undefined} onValueChange={v => { setWorkState(v ?? ""); setWorkCity(""); }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </F>
                    <F label="Work City" required>
                      <Input value={workCity} onChange={e => setWorkCity(e.target.value)} required={isCurrentlyWorking} placeholder="Your city" disabled={!workState} />
                    </F>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                    <F label="Work Area / Department" required hint="Example: HR, Finance, IT"><Input name="work_department" required={isCurrentlyWorking} placeholder="Enter department" defaultValue={profile?.work_department ?? ""} /></F>
                    <F label="Years of Experience">
                      <Input name="years_experience" type="number" min={0} placeholder="Enter years of experience" defaultValue={profile?.years_experience ?? ""} />
                    </F>
                  </div>
                </div>
              )}
              <NextSectionButton accent={accent} onClick={() => setActiveTab("emergency")} />
          </div>

          <div className="space-y-5" data-tab="emergency" style={{ display: activeTab === "emergency" ? undefined : "none" }}>
              <div style={{ background: "rgba(var(--gs-warning-alt-rgb), 0.06)", border: "1px solid rgba(var(--gs-warning-alt-rgb), 0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 4 }}>
                <p style={{ fontSize: 13, color: "var(--gs-warning-alt)", margin: 0 }}>
                  This information is kept confidential and only accessed in case of emergencies during visits.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Emergency Contact Name" required><Input name="emergency_contact_name" required placeholder="Enter contact name" defaultValue={profile?.emergency_contact_name ?? ""} /></F>
                <F label="Relationship" required>
                  <Select required value={emergencyRelation || undefined} onValueChange={v => setEmergencyRelation(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
              </div>
              <F label="Emergency Contact Phone" required hint="Exactly 10 digits"><Input name="emergency_contact_phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Enter contact phone number" onInput={sanitizeDigitsInput(10)} defaultValue={profile?.emergency_contact_phone ?? ""} /></F>
              <F label="Emergency Contact Address" required><Textarea name="emergency_contact_address" rows={2} required placeholder="Enter contact address" defaultValue={profile?.emergency_contact_address ?? ""} /></F>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 10 }}>Medical Information</p>
                <YesNo label="Do you have any allergies?" checked={hasAllergies} onChange={setHasAllergies} />
                {hasAllergies && <F label="Specify allergies" required><Textarea name="allergies_detail" rows={2} required placeholder="Describe allergies" defaultValue={profile?.allergies_detail ?? ""} /></F>}

                <YesNo label="Do you have any existing medical conditions?" checked={hasMedicalConditions} onChange={setHasMedicalConditions} />
                {hasMedicalConditions && <F label="Specify medical conditions" required><Textarea name="medical_conditions_detail" rows={2} required placeholder="Describe medical conditions" defaultValue={profile?.medical_conditions_detail ?? ""} /></F>}

                <YesNo label="Are you taking any regular medicines?" checked={takesMedicines} onChange={setTakesMedicines} />
                {takesMedicines && <F label="Mention medicines" required><Textarea name="medicines_detail" rows={2} required placeholder="List medicines" defaultValue={profile?.medicines_detail ?? ""} /></F>}

                <F label="Dietary Restrictions">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {DIETARY.map(d => (
                      <label key={d} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gs-text-secondary)", cursor: "pointer" }}>
                        <input type="checkbox" name="dietary_restrictions" value={d} defaultChecked={(profile?.dietary_restrictions ?? []).includes(d)} />
                        {d}
                      </label>
                    ))}
                  </div>
                </F>

                <F label="Emergency Medical Notes" hint="Any additional information volunteers or medical staff should know">
                  <Textarea name="medical_notes" rows={3} placeholder="Enter medical notes" defaultValue={profile?.medical_notes ?? ""} />
                </F>
              </div>
              <NextSectionButton accent={accent} onClick={() => setActiveTab("declaration")} />
          </div>

          <div className="space-y-5" data-tab="declaration" style={{ display: activeTab === "declaration" ? undefined : "none" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" name="certified_true" required defaultChecked={profile?.certified_true ?? false} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>
                  I certify that the information provided is true and accurate to the best of my knowledge.
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" name="consent_given" required defaultChecked={profile?.consent_given ?? false} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>
                  I consent to Gyan Setu collecting and using my information for volunteer management, communication, event coordination, and emergency purposes in accordance with applicable privacy policies.
                </span>
              </label>
              <F label="Digital Signature / Name" required><Input name="signature_name" required placeholder="Type full name to sign" defaultValue={profile?.signature_name ?? ""} /></F>
              <F label="Date"><Input disabled value={profile?.updated_at ? formatDate(profile.updated_at) : formatDate(new Date())} /></F>
          </div>

          {activeTab === "declaration" && (
            <Button type="submit" disabled={saving} className="mt-5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          )}
        </form>
</CardContent>
</Card>
      </div>
    </div>
  );
}

function F({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

function NextSectionButton({ accent, onClick }: { accent: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="mt-5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
    >
      Next Section
    </Button>
  );
}

function YesNo({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <F label={label} required>
      <div style={{ display: "flex", gap: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="radio" checked={checked} onChange={() => onChange(true)} /> Yes
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="radio" checked={!checked} onChange={() => onChange(false)} /> No
        </label>
      </div>
    </F>
  );
}
