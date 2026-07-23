"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { upsertVolunteerProfile, getMyVolunteerProfile } from "@/actions/profiles";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { STATE_CITIES, INDIAN_STATES } from "@/lib/locations";
import { FileUploadField } from "@/components/features/file-upload-field";
import type { VolunteerProfile } from "@/types";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't Know"];
const RELATIONS = ["Father", "Mother", "Spouse", "Brother", "Sister", "Friend", "Guardian", "Other"];
const DIETARY = ["Vegetarian", "Vegan", "Jain", "Eggetarian", "Non-Vegetarian", "Gluten-Free", "Lactose-Free", "Diabetic Diet", "Other"];
const STREAMS = ["Engineering", "Science", "Commerce", "Arts", "Medical", "Management", "Law", "Computer Applications", "Agriculture", "Education", "Other"];
const KNOWN_LANGUAGES = ["English", "Marathi", "Hindi"];

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
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
  const accent = variant === "enrollee" ? "#1E5A8A" : "#2A5E3A";
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
  const [sameAddress, setSameAddress] = useState(true);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [hasAllergies, setHasAllergies] = useState(false);
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [takesMedicines, setTakesMedicines] = useState(false);
  const [eduCourseStatus, setEduCourseStatus] = useState("");
  const [collegeState, setCollegeState] = useState("");
  const [collegeCity, setCollegeCity] = useState("");
  const [otherLangChecked, setOtherLangChecked] = useState(false);
  const [otherLangValue, setOtherLangValue] = useState("");
  const [permState, setPermState] = useState("");
  const [permCity, setPermCity] = useState("");

  useEffect(() => {
    getMyVolunteerProfile().then(d => {
      setProfile(d);
      if (d?.date_of_birth) setDob(d.date_of_birth);
      if (d?.state) setSelectedState(d.state);
      if (d?.city) setSelectedCity(d.city);
      if (d?.photo_url) setPhotoUrl(d.photo_url);
      if (d) setSameAddress(d.permanent_address_same ?? true);
      setIsCurrentlyWorking(!!d?.company_name || d?.current_status === "working_professional" || d?.current_status === "both");
      if (d?.edu_course_status) setEduCourseStatus(d.edu_course_status);
      setHasAllergies(d?.has_allergies ?? false);
      setHasMedicalConditions(d?.has_medical_conditions ?? false);
      setTakesMedicines(d?.takes_medicines ?? false);

      // student_location is stored as "City, State" — best-effort split for the dropdowns.
      const locParts = ((d?.student_location as string) ?? "").split(",").map((s: string) => s.trim());
      if (locParts.length === 2 && INDIAN_STATES.includes(locParts[1])) {
        setCollegeState(locParts[1]);
        setCollegeCity(locParts[0]);
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
    setSaving(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const str = (name: string) => (fd.get(name) as string) || undefined;

    const bioText = (fd.get("bio") as string) || "";
    const bioWords = countWords(bioText);
    if (bioWords > 0 && bioWords < 100) {
      setError(`Bio must be at least 100 words (currently ${bioWords}).`);
      setSaving(false);
      return;
    }

    const checkedLangs = fd.getAll("languages") as string[];
    const otherLangs = csvToArray(fd.get("languages_other") as string);

    const permHouseNo = str("perm_house_no");
    const permStreet = str("perm_street");
    const permDistrict = str("perm_district");
    const permPincode = str("perm_pincode");
    const permanentAddressCombined = [
      permHouseNo, permStreet, permCity, permDistrict, permState, permPincode ? `- ${permPincode}` : undefined,
    ].filter(Boolean).join(", ");

    try {
      const p = await upsertVolunteerProfile({
        first_name: str("first_name"),
        middle_name: str("middle_name"),
        last_name: str("last_name"),
        gender: str("gender"),
        date_of_birth: str("date_of_birth"),
        blood_group: str("blood_group"),
        aadhaar_number: str("aadhaar_number"),
        photo_url: photoUrl || undefined,
        phone: str("phone"),
        alternate_phone: str("alternate_phone"),
        house_no: str("house_no"),
        street: str("street"),
        state: selectedState || undefined,
        city: selectedCity || undefined,
        district: str("district"),
        pincode: str("pincode"),
        address: str("address"),
        permanent_address_same: sameAddress,
        permanent_address: sameAddress ? undefined : (permanentAddressCombined || undefined),

        current_status: isCurrentlyWorking ? "both" : "student",
        institution: str("institution"),
        student_location: collegeCity && collegeState ? `${collegeCity}, ${collegeState}` : undefined,
        qualification: str("qualification"),
        course_name: str("course_name"),
        stream: str("stream"),
        edu_course_status: eduCourseStatus as "pursuing" | "completed" | undefined,
        course_year: eduCourseStatus === "completed" ? undefined : str("course_year"),
        company_name: str("company_name"),
        work_location: str("work_location"),
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
        emergency_contact_relation: str("emergency_contact_relation"),
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

  if (loading) return <div className="p-8" style={{ color: "#9B9188" }}>Loading...</div>;

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
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            {variant === "enrollee" ? "Enrollee Portal" : "Volunteer Portal"}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My Profile</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            {variant === "enrollee" ? "Your profile is retained if you are promoted to volunteer." : "Volunteer database entry, skills, and emergency contacts."}
          </p>
        </div>

        {variant === "enrollee" && (
          <div style={{ background: "rgba(74,85,190,0.06)", border: "1px solid rgba(74,85,190,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#4A55BE" }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>You must be <strong>18 or older</strong> to apply for a tour. Set your date of birth to enable tour applications.</span>
          </div>
        )}

        {underAge && (
          <div style={{ background: "rgba(184,56,30,0.06)", border: "1px solid rgba(184,56,30,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#B8381E" }}>
            <AlertCircle size={15} />
            Your age ({age}) does not meet the minimum requirement of 18 to apply for tours.
          </div>
        )}

        {variant === "enrollee" && age !== null && !underAge && (
          <div style={{ background: "rgba(42,94,58,0.07)", border: "1px solid rgba(42,94,58,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2A5E3A" }}>
            <CheckCircle size={15} />
            Age verified ({age} years) — you are eligible to apply for tours.
          </div>
        )}

        {variant === "volunteer" && profile?.consent_given && (
          <div style={{ background: "rgba(42,94,58,0.07)", border: "1px solid rgba(42,94,58,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2A5E3A" }}>
            <CheckCircle size={15} />
            Consent given on {profile.consent_given_at ? new Date(profile.consent_given_at).toLocaleDateString() : "-"}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "white", border: "1px solid #E4DFD1", borderRadius: 8, padding: 4, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, minWidth: 120, padding: "8px 0", fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer", background: activeTab === t.id ? accent : "transparent", color: activeTab === t.id ? "white" : "#5A5247" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {saved && (
            <div style={{ background: "rgba(42,94,58,0.07)", border: "1px solid rgba(42,94,58,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#2A5E3A", display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle size={14} /> Profile saved.
            </div>
          )}

          <div className="space-y-5" style={{ display: activeTab === "personal" ? undefined : "none" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="First Name" required><input name="first_name" required onInput={sanitizeNameInput} defaultValue={(profile?.first_name ?? "").toUpperCase()} style={{ ...inputStyle, textTransform: "uppercase" }} /></F>
                <F label="Middle Name"><input name="middle_name" onInput={sanitizeNameInput} defaultValue={(profile?.middle_name ?? "").toUpperCase()} style={{ ...inputStyle, textTransform: "uppercase" }} /></F>
                <F label="Last Name" required><input name="last_name" required onInput={sanitizeNameInput} defaultValue={(profile?.last_name ?? "").toUpperCase()} style={{ ...inputStyle, textTransform: "uppercase" }} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Gender" required>
                  <select name="gender" required defaultValue={profile?.gender ?? ""} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select gender</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </F>
                <F label="Date of Birth" required>
                  <input name="date_of_birth" type="date" required defaultValue={profile?.date_of_birth ?? ""} onChange={e => setDob(e.target.value)} style={inputStyle} />
                </F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Blood Group" required>
                  <select name="blood_group" required defaultValue={profile?.blood_group ?? ""} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </F>
                <F label="Aadhaar Number" hint="12-digit, numbers only, optional"><input name="aadhaar_number" inputMode="numeric" pattern="[0-9]*" maxLength={12} onInput={sanitizeDigitsInput(12)} defaultValue={profile?.aadhaar_number ?? ""} style={inputStyle} /></F>
              </div>
              <FileUploadField label="Profile Photograph" value={photoUrl} onChange={setPhotoUrl} bucket="media" folder="profile-photos" accept="image/*" showImagePreview required hint="Passport-size, JPG/PNG, max 5 MB. Used on your volunteer ID card." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Mobile Number (WhatsApp)" required hint="Exactly 10 digits"><input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required onInput={sanitizeDigitsInput(10)} defaultValue={profile?.phone ?? ""} style={inputStyle} /></F>
                <F label="Alternate Mobile Number" hint="Exactly 10 digits"><input name="alternate_phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} onInput={sanitizeDigitsInput(10)} defaultValue={profile?.alternate_phone ?? ""} style={inputStyle} /></F>
              </div>

              <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Current Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="House / Flat No." required><input name="house_no" required defaultValue={profile?.house_no ?? ""} style={inputStyle} /></F>
                  <F label="Street / Area" required><input name="street" required defaultValue={profile?.street ?? ""} style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="State" required>
                    <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedCity(""); }} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Village / City" required>
                    {selectedState && STATE_CITIES[selectedState]?.length > 0 ? (
                      <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                        <option value="">Select city</option>
                        {STATE_CITIES[selectedState].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input value={selectedCity} onChange={e => setSelectedCity(e.target.value)} placeholder="Your city/village" style={inputStyle} disabled={!selectedState} />
                    )}
                  </F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="District" required><input name="district" required defaultValue={profile?.district ?? ""} style={inputStyle} /></F>
                  <F label="PIN Code" required hint="6 digits"><input name="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required onInput={sanitizeDigitsInput(6)} defaultValue={profile?.pincode ?? ""} style={inputStyle} /></F>
                </div>
                <F label="Additional Address Notes"><textarea name="address" rows={2} defaultValue={profile?.address ?? ""} style={{ ...inputStyle, resize: "vertical", marginTop: 16 }} /></F>
              </div>

              <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 16 }}>
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
                      <F label="House / Flat No." required><input name="perm_house_no" required={!sameAddress} style={inputStyle} /></F>
                      <F label="Street / Area" required><input name="perm_street" required={!sameAddress} style={inputStyle} /></F>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                      <F label="State" required>
                        <select value={permState} onChange={e => { setPermState(e.target.value); setPermCity(""); }} style={{ ...inputStyle, appearance: "none" }}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </F>
                      <F label="Village / City" required>
                        {permState && STATE_CITIES[permState]?.length > 0 ? (
                          <select value={permCity} onChange={e => setPermCity(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                            <option value="">Select city</option>
                            {STATE_CITIES[permState].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input value={permCity} onChange={e => setPermCity(e.target.value)} placeholder="Your city/village" style={inputStyle} disabled={!permState} />
                        )}
                      </F>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                      <F label="District" required><input name="perm_district" required={!sameAddress} style={inputStyle} /></F>
                      <F label="PIN Code" required hint="6 digits"><input name="perm_pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required={!sameAddress} onInput={sanitizeDigitsInput(6)} style={inputStyle} /></F>
                    </div>
                  </div>
                )}
              </div>

              <F label="Bio" required hint={`Brief introduction about yourself — minimum 100 words`}><textarea name="bio" required rows={5} defaultValue={profile?.bio ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Skills" required hint="Comma-separated: Teaching, Photography, Music..."><input name="skills" required defaultValue={(profile?.skills ?? []).join(", ")} style={inputStyle} /></F>
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
                  <input name="languages_other" placeholder="Specify other language(s), comma-separated" value={otherLangValue} onChange={e => setOtherLangValue(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
                )}
              </F>
              {variant === "volunteer" && (
                <F label="States Visited (previous Gyan Setu)">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {INDIAN_STATES.map(s => (
                      <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5247", cursor: "pointer" }}>
                        <input type="checkbox" name="states_visited" value={s} defaultChecked={(profile?.states_visited ?? []).includes(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </F>
              )}
              <F label="Availability Notes" required><textarea name="availability_notes" required rows={2} placeholder="When are you typically available? Any constraints?" defaultValue={profile?.availability_notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <NextSectionButton accent={accent} onClick={() => setActiveTab("education")} />
          </div>

          <div className="space-y-5" style={{ display: activeTab === "education" ? undefined : "none" }}>
              <F label="College / Institution Name" required><input name="institution" required defaultValue={profile?.institution ?? ""} style={inputStyle} /></F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="College State" required>
                  <select value={collegeState} onChange={e => { setCollegeState(e.target.value); setCollegeCity(""); }} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </F>
                <F label="College City" required>
                  {collegeState && STATE_CITIES[collegeState]?.length > 0 ? (
                    <select value={collegeCity} onChange={e => setCollegeCity(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select city</option>
                      {STATE_CITIES[collegeState].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input value={collegeCity} onChange={e => setCollegeCity(e.target.value)} placeholder="Your city" style={inputStyle} disabled={!collegeState} />
                  )}
                </F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Qualification" required>
                  <select name="qualification" required defaultValue={profile?.qualification ?? ""} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option>Diploma</option><option>UG</option><option>PG</option><option>PhD</option>
                  </select>
                </F>
                <F label="Course Name" required hint="Example: B.Tech, B.Com, MBA"><input name="course_name" required defaultValue={profile?.course_name ?? ""} style={inputStyle} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Stream / Specialization" required>
                  <select name="stream" required defaultValue={profile?.stream ?? ""} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Course Status" required>
                  <select name="edu_course_status" required value={eduCourseStatus} onChange={e => setEduCourseStatus(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option value="pursuing">Pursuing</option>
                    <option value="completed">Completed</option>
                  </select>
                </F>
              </div>
              {eduCourseStatus !== "completed" && (
                <F label="Year / Semester" hint="e.g. 1st Year, Final Semester">
                  <input name="course_year" defaultValue={profile?.course_year ?? ""} style={inputStyle} />
                </F>
              )}
              <NextSectionButton accent={accent} onClick={() => setActiveTab("work")} />
          </div>

          <div className="space-y-5" style={{ display: activeTab === "work" ? undefined : "none" }}>
              <YesNo label="Are you currently working?" checked={isCurrentlyWorking} onChange={setIsCurrentlyWorking} />

              {isCurrentlyWorking && (
                <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Professional Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Company / Organization Name" required><input name="company_name" required={isCurrentlyWorking} defaultValue={profile?.company_name ?? ""} style={inputStyle} /></F>
                    <F label="Location" required hint="City, State"><input name="work_location" required={isCurrentlyWorking} defaultValue={profile?.work_location ?? ""} style={inputStyle} /></F>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                    <F label="Designation" required><input name="designation" required={isCurrentlyWorking} defaultValue={profile?.designation ?? ""} style={inputStyle} /></F>
                    <F label="Work Area / Department" required hint="Example: HR, Finance, IT"><input name="work_department" required={isCurrentlyWorking} defaultValue={profile?.work_department ?? ""} style={inputStyle} /></F>
                  </div>
                  <F label="Years of Experience">
                    <input name="years_experience" type="number" min={0} defaultValue={profile?.years_experience ?? ""} style={{ ...inputStyle, marginTop: 16 }} />
                  </F>
                </div>
              )}
              <NextSectionButton accent={accent} onClick={() => setActiveTab("emergency")} />
          </div>

          <div className="space-y-5" style={{ display: activeTab === "emergency" ? undefined : "none" }}>
              <div style={{ background: "rgba(168,100,28,0.06)", border: "1px solid rgba(168,100,28,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 4 }}>
                <p style={{ fontSize: 13, color: "#A8641C", margin: 0 }}>
                  This information is kept confidential and only accessed in case of emergencies during visits.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Emergency Contact Name" required><input name="emergency_contact_name" required defaultValue={profile?.emergency_contact_name ?? ""} style={inputStyle} /></F>
                <F label="Relationship" required>
                  <select name="emergency_contact_relation" required defaultValue={profile?.emergency_contact_relation ?? ""} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </F>
              </div>
              <F label="Emergency Contact Phone" required hint="Exactly 10 digits"><input name="emergency_contact_phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required onInput={sanitizeDigitsInput(10)} defaultValue={profile?.emergency_contact_phone ?? ""} style={inputStyle} /></F>
              <F label="Emergency Contact Address" required><textarea name="emergency_contact_address" rows={2} required defaultValue={profile?.emergency_contact_address ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>

              <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Medical Information</p>
                <YesNo label="Do you have any allergies?" checked={hasAllergies} onChange={setHasAllergies} />
                {hasAllergies && <F label="Specify allergies" required><textarea name="allergies_detail" rows={2} required defaultValue={profile?.allergies_detail ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>}

                <YesNo label="Do you have any existing medical conditions?" checked={hasMedicalConditions} onChange={setHasMedicalConditions} />
                {hasMedicalConditions && <F label="Specify medical conditions" required><textarea name="medical_conditions_detail" rows={2} required defaultValue={profile?.medical_conditions_detail ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>}

                <YesNo label="Are you taking any regular medicines?" checked={takesMedicines} onChange={setTakesMedicines} />
                {takesMedicines && <F label="Mention medicines" required><textarea name="medicines_detail" rows={2} required defaultValue={profile?.medicines_detail ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>}

                <F label="Dietary Restrictions">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                    {DIETARY.map(d => (
                      <label key={d} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5247", cursor: "pointer" }}>
                        <input type="checkbox" name="dietary_restrictions" value={d} defaultChecked={(profile?.dietary_restrictions ?? []).includes(d)} />
                        {d}
                      </label>
                    ))}
                  </div>
                </F>

                <F label="Emergency Medical Notes" hint="Any additional information volunteers or medical staff should know">
                  <textarea name="medical_notes" rows={3} defaultValue={profile?.medical_notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
                </F>
              </div>
              <NextSectionButton accent={accent} onClick={() => setActiveTab("declaration")} />
          </div>

          <div className="space-y-5" style={{ display: activeTab === "declaration" ? undefined : "none" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" name="certified_true" required defaultChecked={profile?.certified_true ?? false} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#19140F", lineHeight: 1.5 }}>
                  I certify that the information provided is true and accurate to the best of my knowledge.
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" name="consent_given" required defaultChecked={profile?.consent_given ?? false} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#19140F", lineHeight: 1.5 }}>
                  I consent to Gyan Setu collecting and using my information for volunteer management, communication, event coordination, and emergency purposes in accordance with applicable privacy policies.
                </span>
              </label>
              <F label="Digital Signature / Name" required><input name="signature_name" required defaultValue={profile?.signature_name ?? ""} style={inputStyle} /></F>
              <F label="Date"><input disabled value={profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : new Date().toLocaleDateString()} style={{ ...inputStyle, color: "#9B9188" }} /></F>
          </div>

          {activeTab === "declaration" && (
            <button type="submit" disabled={saving} style={{ marginTop: 20, background: accent, color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function F({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

function NextSectionButton({ accent, onClick }: { accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ marginTop: 20, background: accent, color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: "pointer" }}
    >
      Next Section
    </button>
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
