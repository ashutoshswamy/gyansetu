"use client";

import { useState, useEffect } from "react";
import { upsertVolunteerProfile, getMyVolunteerProfile } from "@/actions/profiles";
import { User, Phone, AlertCircle, CheckCircle } from "lucide-react";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "emergency">("personal");

  useEffect(() => {
    getMyVolunteerProfile().then(d => { setProfile(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function csvToArray(val: string) { return val.split(",").map(s => s.trim()).filter(Boolean); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    try {
      const p = await upsertVolunteerProfile({
        phone: fd.get("phone") as string || undefined,
        address: fd.get("address") as string || undefined,
        date_of_birth: fd.get("date_of_birth") as string || undefined,
        institution: fd.get("institution") as string || undefined,
        course_year: fd.get("course_year") as string || undefined,
        bio: fd.get("bio") as string || undefined,
        skills: csvToArray(fd.get("skills") as string),
        languages: csvToArray(fd.get("languages") as string),
        states_visited: fd.getAll("states_visited") as string[],
        emergency_contact_name: fd.get("emergency_contact_name") as string || undefined,
        emergency_contact_phone: fd.get("emergency_contact_phone") as string || undefined,
        emergency_contact_relation: fd.get("emergency_contact_relation") as string || undefined,
        medical_notes: fd.get("medical_notes") as string || undefined,
        consent_given: fd.get("consent_given") === "on",
        availability_notes: fd.get("availability_notes") as string || undefined,
      });
      setProfile(p);
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8" style={{ color: "#9B9188" }}>Loading...</div>;

  const tabs = [
    { id: "personal" as const, label: "Personal Info" },
    { id: "emergency" as const, label: "Emergency & Consent" },
  ];

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My Profile</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Volunteer database entry, skills, and emergency contacts</p>
        </div>

        {profile?.consent_given && (
          <div style={{ background: "rgba(42,94,58,0.07)", border: "1px solid rgba(42,94,58,0.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2A5E3A" }}>
            <CheckCircle size={15} />
            Consent given on {new Date(profile.consent_given_at).toLocaleDateString()}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "white", border: "1px solid #E4DFD1", borderRadius: 8, padding: 4 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer", background: activeTab === t.id ? "#2A5E3A" : "transparent", color: activeTab === t.id ? "white" : "#5A5247" }}
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
              <CheckCircle size={14} /> Profile saved successfully.
            </div>
          )}

          {activeTab === "personal" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <F label="Phone"><input name="phone" defaultValue={profile?.phone ?? ""} style={inputStyle} /></F>
                <F label="Date of Birth"><input name="date_of_birth" type="date" defaultValue={profile?.date_of_birth ?? ""} style={inputStyle} /></F>
              </div>
              <F label="Address"><textarea name="address" rows={2} defaultValue={profile?.address ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Institution / College"><input name="institution" defaultValue={profile?.institution ?? ""} style={inputStyle} /></F>
                <F label="Course & Year"><input name="course_year" placeholder="e.g. B.Tech 3rd Year" defaultValue={profile?.course_year ?? ""} style={inputStyle} /></F>
              </div>
              <F label="Bio" hint="Brief introduction about yourself"><textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Skills" hint="Comma-separated: Teaching, Photography, Music..."><input name="skills" defaultValue={(profile?.skills ?? []).join(", ")} style={inputStyle} /></F>
              <F label="Languages Known" hint="Comma-separated"><input name="languages" defaultValue={(profile?.languages ?? []).join(", ")} style={inputStyle} /></F>
              <F label="States Visited (previous Gyan Setu)">
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {INDIAN_STATES.map(s => (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5247", cursor: "pointer" }}>
                      <input type="checkbox" name="states_visited" value={s} defaultChecked={(profile?.states_visited ?? []).includes(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </F>
              <F label="Availability Notes"><textarea name="availability_notes" rows={2} placeholder="When are you typically available? Any constraints?" defaultValue={profile?.availability_notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="space-y-5">
              <div style={{ background: "rgba(168,100,28,0.06)", border: "1px solid rgba(168,100,28,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 4 }}>
                <p style={{ fontSize: 13, color: "#A8641C", margin: 0 }}>
                  This information is kept confidential and only accessed in case of emergencies during visits.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Emergency Contact Name" required><input name="emergency_contact_name" required defaultValue={profile?.emergency_contact_name ?? ""} style={inputStyle} /></F>
                <F label="Relationship"><input name="emergency_contact_relation" placeholder="e.g. Parent, Sibling" defaultValue={profile?.emergency_contact_relation ?? ""} style={inputStyle} /></F>
              </div>
              <F label="Emergency Contact Phone" required><input name="emergency_contact_phone" required defaultValue={profile?.emergency_contact_phone ?? ""} style={inputStyle} /></F>
              <F label="Medical Notes / Allergies / Dietary Requirements"><textarea name="medical_notes" rows={3} placeholder="Any medical conditions, allergies, dietary restrictions the team should be aware of..." defaultValue={profile?.medical_notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 16 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" name="consent_given" defaultChecked={profile?.consent_given ?? false} style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "#19140F", lineHeight: 1.5 }}>
                    I give my consent to participate in the Gyan Setu visit and acknowledge that my emergency contact details may be accessed by team coordinators in case of need. I understand the nature of the visit and voluntarily choose to participate.
                  </span>
                </label>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} style={{ marginTop: 20, background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
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
