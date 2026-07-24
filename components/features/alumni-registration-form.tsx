"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { submitAlumniRegistration } from "@/actions/alumni-registration";

type Visit = { year: string; month: string; location: string; role: string };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const VISIT_ROLES = ["Volunteer", "Team Lead", "Resource Person", "Coordinator", "EARC Member", "Project Head", "Other"];
const STREAMS = ["Engineering", "Science", "Commerce", "Arts", "Medical", "Management", "Law", "Computer Applications", "Agriculture", "Education", "Other"];
const CONTRIBUTION_MODES = ["School Visits", "Online Mentoring", "Content Creation", "Fundraising", "Career Guidance", "Event Management", "Social Media", "Translation", "Research", "Technical Support", "Other"];
const INTEREST_AREAS = ["Science", "Mathematics", "National Integration", "Education", "Career Guidance", "Leadership", "Exhibition", "Research"];
const COMM_MODES = ["Phone", "WhatsApp", "Email"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't Know"];

const emptyVisit: Visit = { year: "", month: "", location: "", role: "" };
const accent = "#4A55BE";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14,
  border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
  background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
};

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

function NextSectionButton({ onClick }: { onClick: () => void }) {
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

function CheckboxGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
      {options.map((o) => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5247", cursor: "pointer" }}>
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} /> {o}
        </label>
      ))}
    </div>
  );
}

export function AlumniRegistrationForm() {
  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "", gender: "", date_of_birth: "", blood_group: "",
    email: "",
    company_name: "", work_city: "", work_state: "", designation: "", work_department: "", years_experience: "",
    institution: "", edu_city: "", edu_state: "", qualification: "", course_name: "", stream: "", course_status: "",
    mobile_number: "", alternate_mobile_number: "", linkedin_url: "",
    interested_volunteering: "", available_network_activities: "", availability: "", willing_to_mentor_new: "",
    why_stay_connected: "", skills_contribute: "", suggestions: "", additional_remarks: "",
  });
  const [visits, setVisits] = useState<Visit[]>([{ ...emptyVisit }]);
  const [preferredCommunication, setPreferredCommunication] = useState<string[]>([]);
  const [preferredContribution, setPreferredContribution] = useState<string[]>([]);
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"personal" | "visits" | "work" | "contact" | "engagement" | "additional">("personal");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleDigitsChange(maxLen: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, maxLen) }));
    };
  }

  function updateVisit(i: number, field: keyof Visit, value: string) {
    setVisits((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const invalid = formEl.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(":invalid");
    if (invalid) {
      const tab = invalid.closest<HTMLElement>("[data-tab]")?.dataset.tab as typeof activeTab | undefined;
      if (tab && tab !== activeTab) setActiveTab(tab);
      const fieldLabel = invalid.closest("div")?.querySelector("label")?.textContent?.replace("*", "").trim() || invalid.name || "a field";
      setErrorMsg(`Please fill in "${fieldLabel}" — required field.`);
      setStatus("error");
      requestAnimationFrame(() => {
        invalid.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid.focus();
        formEl.reportValidity();
      });
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitAlumniRegistration({
        name: [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ").trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        last_name: form.last_name.trim(),
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        blood_group: form.blood_group || undefined,
        visit_history: visits.filter((v) => v.year || v.month || v.location || v.role),
        company_name: form.company_name.trim() || undefined,
        work_location: [form.work_city.trim(), form.work_state.trim()].filter(Boolean).join(", ") || undefined,
        designation: form.designation.trim() || undefined,
        work_department: form.work_department.trim() || undefined,
        years_experience: form.years_experience ? Number(form.years_experience) : undefined,
        institution: form.institution.trim() || undefined,
        edu_location: [form.edu_city.trim(), form.edu_state.trim()].filter(Boolean).join(", ") || undefined,
        qualification: form.qualification || undefined,
        course_name: form.course_name.trim() || undefined,
        stream: form.stream || undefined,
        course_status: (form.course_status || undefined) as "pursuing" | "completed" | undefined,
        mobile_number: form.mobile_number.trim() || undefined,
        alternate_mobile_number: form.alternate_mobile_number.trim() || undefined,
        linkedin_url: form.linkedin_url.trim() || undefined,
        preferred_communication: preferredCommunication,
        interested_volunteering: (form.interested_volunteering || undefined) as "Yes" | "No" | "Maybe" | undefined,
        available_network_activities: (form.available_network_activities || undefined) as "Yes" | "No" | "Maybe" | undefined,
        preferred_contribution: preferredContribution,
        areas_of_interest: areasOfInterest,
        availability: (form.availability || undefined) as "Weekdays" | "Weekends" | "Both" | "Occasionally" | undefined,
        willing_to_mentor_new: (form.willing_to_mentor_new || undefined) as "Yes" | "No" | "Maybe" | undefined,
        willing_to_mentor: form.willing_to_mentor_new === "Yes",
        why_stay_connected: form.why_stay_connected.trim() || undefined,
        skills_contribute: form.skills_contribute.trim() || undefined,
        suggestions: form.suggestions.trim() || undefined,
        additional_remarks: form.additional_remarks.trim() || undefined,
      });
      setStatus("success");
      toast.success("Registration submitted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      setStatus("error");
      toast.error(message);
    }
  }

  const tabs = [
    { id: "personal" as const, label: "Personal Info" },
    { id: "visits" as const, label: "Visit History" },
    { id: "work" as const, label: "Education / Work" },
    { id: "contact" as const, label: "Contact" },
    { id: "engagement" as const, label: "Engagement" },
    { id: "additional" as const, label: "Additional Info" },
  ];

  if (status === "success") {
    return (
      <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
        <div className="max-w-3xl mx-auto">
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(42,94,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={22} color="#2A5E3A" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#19140F", margin: "0 0 10px" }}>Registration Received!</h2>
            <p style={{ fontSize: 13, color: "#5A5247", lineHeight: 1.65, margin: "0 0 20px" }}>
              Welcome back to the Gyan Setu family. A confirmation email is on its way to your inbox.
            </p>
            <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: accent, textDecoration: "none" }}>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-32 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Alumni Network</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Alumni Registration</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Once a Jnana Prabodhini, always a Jnana Prabodhini — reconnect and stay part of the Gyan Setu family.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "white", border: "1px solid #E4DFD1", borderRadius: 8, padding: 4, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, minWidth: 110, padding: "8px 0", fontSize: 12.5, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer", background: activeTab === t.id ? accent : "transparent", color: activeTab === t.id ? "white" : "#5A5247" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {status === "error" && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div className="space-y-5" data-tab="personal" style={{ display: activeTab === "personal" ? undefined : "none" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="First Name" required><input name="first_name" required placeholder="Enter first name" value={form.first_name} onChange={handleChange} style={inputStyle} /></F>
                <F label="Middle Name"><input name="middle_name" placeholder="Enter middle name" value={form.middle_name} onChange={handleChange} style={inputStyle} /></F>
                <F label="Last Name" required><input name="last_name" required placeholder="Enter last name" value={form.last_name} onChange={handleChange} style={inputStyle} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="Gender" required>
                  <select name="gender" required value={form.gender} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </F>
                <F label="Date of Birth" required><input name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleChange} style={inputStyle} /></F>
                <F label="Blood Group">
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("visits")} />
          </div>

          <div className="space-y-3" data-tab="visits" style={{ display: activeTab === "visits" ? undefined : "none" }}>
              <p style={{ fontSize: 13, color: "#5A5247", marginBottom: 4 }}>Add every Gyan Setu tour you&apos;ve been part of.</p>
              {visits.map((v, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.4fr_1fr_auto]" style={{ gap: 8, alignItems: "end" }}>
                  <F label="Year">
                    <select value={v.year} onChange={(e) => updateVisit(i, "year", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Year</option>
                      {Array.from({ length: 25 }, (_, y) => new Date().getFullYear() - y).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </F>
                  <F label="Month">
                    <select value={v.month} onChange={(e) => updateVisit(i, "month", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Month</option>
                      {MONTHS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </F>
                  <F label="Location of Visit"><input value={v.location} onChange={(e) => updateVisit(i, "location", e.target.value)} placeholder="State / District / Project" style={inputStyle} /></F>
                  <F label="Role">
                    <select value={v.role} onChange={(e) => updateVisit(i, "role", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Role</option>
                      {VISIT_ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </F>
                  {visits.length > 1 && (
                    <button type="button" onClick={() => setVisits((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ height: 34, padding: "0 10px", fontSize: 12, color: "#C0392B", background: "transparent", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 6, cursor: "pointer" }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setVisits((prev) => [...prev, { ...emptyVisit }])}
                style={{ fontSize: 12.5, fontWeight: 600, color: accent, background: "transparent", border: "none", padding: "6px 0", cursor: "pointer" }}>
                + Add another visit
              </button>
              <NextSectionButton onClick={() => setActiveTab("work")} />
          </div>

          <div className="space-y-5" data-tab="work" style={{ display: activeTab === "work" ? undefined : "none" }}>
              <div style={{ borderBottom: "1px solid #E4DFD1", paddingBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Professional Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Company / Organization Name"><input name="company_name" placeholder="Enter company name" value={form.company_name} onChange={handleChange} style={inputStyle} /></F>
                  <F label="Years of Experience"><input name="years_experience" type="number" min={0} placeholder="Enter years of experience" value={form.years_experience} onChange={handleChange} style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginTop: 16 }}>
                  <F label="Designation"><input name="designation" placeholder="Enter designation" value={form.designation} onChange={handleChange} style={inputStyle} /></F>
                  <F label="Work Area / Department" hint="e.g. HR, IT"><input name="work_department" placeholder="Enter department" value={form.work_department} onChange={handleChange} style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="City"><input name="work_city" placeholder="Enter city" value={form.work_city} onChange={handleChange} style={inputStyle} /></F>
                  <F label="State"><input name="work_state" placeholder="Enter state" value={form.work_state} onChange={handleChange} style={inputStyle} /></F>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", marginBottom: 10 }}>Educational Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="College / Institution Name" required><input name="institution" required placeholder="Enter institution name" value={form.institution} onChange={handleChange} style={inputStyle} /></F>
                  <F label="Qualification" required>
                    <select name="qualification" required value={form.qualification} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select</option>
                      <option>Diploma</option><option>UG</option><option>PG</option><option>PhD</option><option>Other</option>
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="City" required><input name="edu_city" required placeholder="Enter city" value={form.edu_city} onChange={handleChange} style={inputStyle} /></F>
                  <F label="State" required><input name="edu_state" required placeholder="Enter state" value={form.edu_state} onChange={handleChange} style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="Course Name" required hint="e.g. B.Tech, B.Com, MBA"><input name="course_name" required placeholder="Enter course name" value={form.course_name} onChange={handleChange} style={inputStyle} /></F>
                  <F label="Stream / Specialization" required>
                    <select name="stream" required value={form.stream} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select</option>
                      {STREAMS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                </div>
                <F label="Course Status" required>
                  <select name="course_status" required value={form.course_status} onChange={handleChange} style={{ ...inputStyle, appearance: "none", marginTop: 16, maxWidth: 260 }}>
                    <option value="">Select</option>
                    <option value="pursuing">Pursuing</option>
                    <option value="completed">Completed</option>
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("contact")} />
          </div>

          <div className="space-y-5" data-tab="contact" style={{ display: activeTab === "contact" ? undefined : "none" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Mobile Number" required hint="Exactly 10 digits"><input name="mobile_number" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Enter mobile number" value={form.mobile_number} onChange={handleDigitsChange(10)} style={inputStyle} /></F>
                <F label="Alternate Mobile Number" hint="Exactly 10 digits"><input name="alternate_mobile_number" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Enter alternate mobile number" value={form.alternate_mobile_number} onChange={handleDigitsChange(10)} style={inputStyle} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Email" required><input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} /></F>
                <F label="LinkedIn Profile"><input name="linkedin_url" type="url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." style={inputStyle} /></F>
              </div>
              <F label="Preferred Mode of Communication">
                <div style={{ display: "flex", gap: 20 }}>
                  {COMM_MODES.map((m) => (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A5247", cursor: "pointer" }}>
                      <input type="checkbox" checked={preferredCommunication.includes(m)} onChange={() => toggle(preferredCommunication, setPreferredCommunication, m)} /> {m}
                    </label>
                  ))}
                </div>
              </F>
              <NextSectionButton onClick={() => setActiveTab("engagement")} />
          </div>

          <div className="space-y-5" data-tab="engagement" style={{ display: activeTab === "engagement" ? undefined : "none" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Interested in Volunteering">
                  <select name="interested_volunteering" value={form.interested_volunteering} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option><option>Yes</option><option>No</option><option>Maybe</option>
                  </select>
                </F>
                <F label="Available for Network Activities">
                  <select name="available_network_activities" value={form.available_network_activities} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option><option>Yes</option><option>No</option><option>Maybe</option>
                  </select>
                </F>
              </div>
              <F label="Preferred Mode of Contribution">
                <CheckboxGroup options={CONTRIBUTION_MODES} selected={preferredContribution} onToggle={(v) => toggle(preferredContribution, setPreferredContribution, v)} />
              </F>
              <F label="Areas of Interest">
                <CheckboxGroup options={INTEREST_AREAS} selected={areasOfInterest} onToggle={(v) => toggle(areasOfInterest, setAreasOfInterest, v)} />
              </F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Availability">
                  <select name="availability" value={form.availability} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option>Weekdays</option><option>Weekends</option><option>Both</option><option>Occasionally</option>
                  </select>
                </F>
                <F label="Willing to Mentor New Volunteers">
                  <select name="willing_to_mentor_new" value={form.willing_to_mentor_new} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option><option>Yes</option><option>No</option><option>Maybe</option>
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("additional")} />
          </div>

          <div className="space-y-5" data-tab="additional" style={{ display: activeTab === "additional" ? undefined : "none" }}>
              <F label="Why would you like to stay connected with Gyan Setu?"><textarea name="why_stay_connected" placeholder="Your answer" value={form.why_stay_connected} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Skills that you can contribute"><textarea name="skills_contribute" placeholder="Your answer" value={form.skills_contribute} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Any suggestions for strengthening the Alumni Network?"><textarea name="suggestions" placeholder="Your suggestions" value={form.suggestions} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Additional Remarks"><textarea name="additional_remarks" placeholder="Additional remarks" value={form.additional_remarks} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></F>

              <button type="submit" disabled={status === "loading"} style={{ marginTop: 20, background: accent, color: "white", fontSize: 13, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.7 : 1 }}>
                {status === "loading" ? "Submitting..." : "Register as Alumni"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
