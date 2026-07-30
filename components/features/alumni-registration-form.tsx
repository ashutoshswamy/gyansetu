"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { submitAlumniRegistration } from "@/actions/alumni-registration";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, btnMarigold, btnInk, Eyebrow } from "@/components/landing/theme";

type Visit = { year: string; month: string; location: string; role: string };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const VISIT_ROLES = ["Volunteer", "Team Lead", "Resource Person", "Coordinator", "EARC Member", "Project Head", "Other"];
const STREAMS = ["Engineering", "Science", "Commerce", "Arts", "Medical", "Management", "Law", "Computer Applications", "Agriculture", "Education", "Other"];
const CONTRIBUTION_MODES = ["School Visits", "Online Mentoring", "Content Creation", "Fundraising", "Career Guidance", "Event Management", "Social Media", "Translation", "Research", "Technical Support", "Other"];
const INTEREST_AREAS = ["Science", "Mathematics", "National Integration", "Education", "Career Guidance", "Leadership", "Exhibition", "Research"];
const COMM_MODES = ["Phone", "WhatsApp", "Email"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't Know"];

const emptyVisit: Visit = { year: "", month: "", location: "", role: "" };

const TABS = [
  { id: "personal", num: "01", label: "Personal Info" },
  { id: "visits", num: "02", label: "Visit History" },
  { id: "work", num: "03", label: "Education / Work" },
  { id: "contact", num: "04", label: "Contact" },
  { id: "engagement", num: "05", label: "Engagement" },
  { id: "additional", num: "06", label: "Additional Info" },
] as const;

/* ── Field-journal input style — matches the landing page's paper/dashed-line identity ── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: 14,
  border: "1.5px solid var(--gs-line)", borderRadius: 4, outline: "none",
  background: "var(--gs-paper)", color: "var(--gs-text)", boxSizing: "border-box",
  fontFamily: F_BODY,
};

/* Focus rings on the paper inputs — the only bit CSS custom properties need help with. */
const FIELD_FOCUS_CSS = `
  .gs-field:focus { border-color: var(--gs-rust) !important; box-shadow: 0 0 0 3px rgba(184,73,46,.12); }
`;

/* Faint ruled-ledger lines behind the card — inputs sit on solid paper so the rule only
   reads in the gaps between fields, echoing the register/logbook this form fills out. */
const RULED_PAPER_BG: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 36px, var(--gs-line) 37px, transparent 38px)",
};

function F({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: F_BODY, fontSize: 12, fontWeight: 600, color: "var(--gs-text-soft)", display: "block", marginBottom: hint ? 2 : 6 }}>
        {label}{required && <span style={{ color: "var(--gs-rust)", marginLeft: 2 }}>*</span>}
      </label>
      {hint && <p style={{ fontFamily: F_BODY, fontSize: 11, color: "var(--gs-text-mute)", margin: "0 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

/* Ledger-entry section header — a large italic folio number stands in for the small
   "GS·0N" pill, closer to a register book's running page numbers than an app tab. */
function SectionHeader({ num, label, hint }: { num: string; label: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 22, paddingBottom: 14, borderBottom: "1px dashed var(--gs-line)" }}>
      <span style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: 32, fontWeight: 600, color: "var(--gs-rust)", lineHeight: 1 }}>{num}</span>
      <div>
        <h2 style={{ fontFamily: F_DISPLAY, fontSize: 19, fontWeight: 600, color: "var(--gs-text)", margin: 0 }}>{label}</h2>
        {hint && <p style={{ fontFamily: F_BODY, fontSize: 12.5, color: "var(--gs-text-mute)", margin: "4px 0 0" }}>{hint}</p>}
      </div>
    </div>
  );
}

function NextSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...btnInk, marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8 }}>
      Next Section <ArrowRight size={14} />
    </button>
  );
}

function CheckboxGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
      {options.map((o) => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F_BODY, fontSize: 12, color: "var(--gs-text-soft)", cursor: "pointer" }}>
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} style={{ accentColor: "var(--gs-rust)" }} /> {o}
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
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("personal");
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

  // Which nav tabs have their required fields filled — drives the checkmark on the
  // ledger index. Visits/Engagement/Additional carry no required fields, so they're
  // left unmarked rather than showing a misleading "done" before the user opens them.
  function isTabComplete(tab: (typeof TABS)[number]["id"]): boolean | null {
    if (tab === "personal") return !!(form.first_name && form.last_name && form.gender && form.date_of_birth);
    if (tab === "work") return !!(form.institution && form.qualification && form.edu_city && form.edu_state && form.course_name && form.stream && form.course_status);
    if (tab === "contact") return !!(form.mobile_number && form.email);
    return null;
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
        invalid.reportValidity();
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

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  if (status === "success") {
    return (
      <div className={`min-h-screen p-8 ${fontVars}`} style={{ ...pageVars, background: "var(--gs-paper-deep)", fontFamily: F_BODY }}>
        <div className="max-w-3xl mx-auto">
          <div style={{ background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(184,73,46,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={22} color="var(--gs-rust)" />
            </div>
            <h2 style={{ fontFamily: F_DISPLAY, fontSize: 22, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 10px" }}>Registration Received!</h2>
            <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-soft)", lineHeight: 1.65, margin: "0 0 20px" }}>
              Welcome back to the Gyan Setu family. A confirmation email is on its way to your inbox.
            </p>
            <Link href="/" style={{ fontFamily: F_BODY, fontSize: 13, fontWeight: 700, color: "var(--gs-rust)", textDecoration: "none" }}>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 pb-32 sm:p-8 ${fontVars}`} style={{ ...pageVars, background: "var(--gs-paper-deep)", fontFamily: F_BODY }}>
      <style>{FIELD_FOCUS_CSS}</style>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Eyebrow>Alumni Network</Eyebrow>
          <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(30px,4vw,44px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: 0 }}>
            Alumni <span style={{ color: "var(--gs-rust)", fontStyle: "italic" }}>Registration</span>
          </h1>
          <p style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-soft)", marginTop: 10, lineHeight: 1.65, maxWidth: 560 }}>
            Once a Jnana Prabodhini, always a Jnana Prabodhini — reconnect and stay part of the Gyan Setu family.
          </p>
          <p style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gs-text-mute)", marginTop: 14 }}>
            6 Sections · About 8–10 Minutes
          </p>
        </div>

        {/* Ledger index — running folio numbers instead of app-style pills, with a
            thin progress rule underneath tracking how far through the register you are. */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const complete = isTabComplete(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                    padding: "8px 16px 12px", minWidth: 112, textAlign: "left", flexShrink: 0,
                    background: "transparent", border: "none",
                    borderBottom: active ? "2px solid var(--gs-rust)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: 18, fontWeight: 600, color: active ? "var(--gs-rust)" : "var(--gs-text-mute)" }}>
                      {t.num}
                    </span>
                    {complete && <CheckCircle size={12} color="var(--gs-rust)" />}
                  </span>
                  <span style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: active ? "var(--gs-text)" : "var(--gs-text-mute)" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ height: 2, background: "var(--gs-line)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, width: `${((activeIndex + 1) / TABS.length) * 100}%`, background: "var(--gs-rust)", transition: "width .25s ease" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ ...RULED_PAPER_BG, background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: 28 }}>
          {status === "error" && (
            <div style={{ background: "rgba(184,73,46,.08)", border: "1px solid rgba(184,73,46,.3)", borderRadius: 4, padding: "10px 14px", marginBottom: 20, fontFamily: F_BODY, fontSize: 13, color: "var(--gs-rust)", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div className="space-y-5" data-tab="personal" style={{ display: activeTab === "personal" ? undefined : "none" }}>
              <SectionHeader num="01" label="Personal Information" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="First Name" required><input name="first_name" required placeholder="Enter first name" value={form.first_name} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                <F label="Middle Name"><input name="middle_name" placeholder="Enter middle name" value={form.middle_name} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                <F label="Last Name" required><input name="last_name" required placeholder="Enter last name" value={form.last_name} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="Gender" required>
                  <select name="gender" required value={form.gender} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </F>
                <F label="Date of Birth" required><input name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                <F label="Blood Group">
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("visits")} />
          </div>

          <div className="space-y-3" data-tab="visits" style={{ display: activeTab === "visits" ? undefined : "none" }}>
              <SectionHeader num="02" label="Gyan-Setu Visit History" hint="Add every Gyan Setu tour you've been part of." />
              <div className="space-y-3">
                {visits.map((v, i) => (
                  <div key={i} style={{ position: "relative", border: "1px dashed var(--gs-line)", borderRadius: 4, padding: "16px 16px 14px", background: "var(--gs-paper-deep)" }}>
                    <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", border: "1.5px dashed var(--gs-rust)", opacity: 0.5 }} />
                    <p style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-text-mute)", margin: "0 0 12px" }}>
                      Visit {String(i + 1).padStart(2, "0")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <F label="Year">
                        <select value={v.year} onChange={(e) => updateVisit(i, "year", e.target.value)} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                          <option value="">Year</option>
                          {Array.from({ length: 25 }, (_, y) => new Date().getFullYear() - y).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                      </F>
                      <F label="Month">
                        <select value={v.month} onChange={(e) => updateVisit(i, "month", e.target.value)} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                          <option value="">Month</option>
                          {MONTHS.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </F>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                      <F label="Location of Visit"><input value={v.location} onChange={(e) => updateVisit(i, "location", e.target.value)} placeholder="State / District / Project" className="gs-field" style={inputStyle} /></F>
                      <F label="Role">
                        <select value={v.role} onChange={(e) => updateVisit(i, "role", e.target.value)} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                          <option value="">Role</option>
                          {VISIT_ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </F>
                    </div>
                    {visits.length > 1 && (
                      <button type="button" onClick={() => setVisits((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ marginTop: 12, height: 32, padding: "0 12px", fontFamily: F_BODY, fontSize: 12, color: "var(--gs-rust)", background: "transparent", border: "1px solid rgba(184,73,46,.35)", borderRadius: 4, cursor: "pointer" }}>
                        Remove Visit
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setVisits((prev) => [...prev, { ...emptyVisit }])}
                style={{ fontFamily: F_BODY, fontSize: 12.5, fontWeight: 600, color: "var(--gs-rust)", background: "transparent", border: "none", padding: "6px 0", cursor: "pointer" }}>
                + Add another visit
              </button>
              <NextSectionButton onClick={() => setActiveTab("work")} />
          </div>

          <div className="space-y-5" data-tab="work" style={{ display: activeTab === "work" ? undefined : "none" }}>
              <SectionHeader num="03" label="Education & Professional Details" />
              <div style={{ borderBottom: "1px dashed var(--gs-line)", paddingBottom: 16 }}>
                <p style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-text-mute)", marginBottom: 12 }}>Professional Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Company / Organization Name"><input name="company_name" placeholder="Enter company name" value={form.company_name} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="Years of Experience"><input name="years_experience" type="number" min={0} placeholder="Enter years of experience" value={form.years_experience} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginTop: 16 }}>
                  <F label="Designation"><input name="designation" placeholder="Enter designation" value={form.designation} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="Work Area / Department" hint="e.g. HR, IT"><input name="work_department" placeholder="Enter department" value={form.work_department} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="City"><input name="work_city" placeholder="Enter city" value={form.work_city} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="State/Union Territory"><input name="work_state" placeholder="Enter state" value={form.work_state} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                </div>
              </div>

              <div>
                <p style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-text-mute)", marginBottom: 12 }}>Educational Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="College / Institution Name" required><input name="institution" required placeholder="Enter institution name" value={form.institution} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="Qualification" required>
                    <select name="qualification" required value={form.qualification} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select</option>
                      <option>Diploma</option><option>UG</option><option>PG</option><option>PhD</option><option>Other</option>
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="City" required><input name="edu_city" required placeholder="Enter city" value={form.edu_city} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="State/Union Territory" required><input name="edu_state" required placeholder="Enter state" value={form.edu_state} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                  <F label="Course Name" required hint="e.g. B.Tech, B.Com, MBA"><input name="course_name" required placeholder="Enter course name" value={form.course_name} onChange={handleChange} className="gs-field" style={inputStyle} /></F>
                  <F label="Stream / Specialization" required>
                    <select name="stream" required value={form.stream} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select</option>
                      {STREAMS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                </div>
                <F label="Course Status" required>
                  <select name="course_status" required value={form.course_status} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none", marginTop: 16, maxWidth: 260 }}>
                    <option value="">Select</option>
                    <option value="pursuing">Pursuing</option>
                    <option value="completed">Completed</option>
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("contact")} />
          </div>

          <div className="space-y-5" data-tab="contact" style={{ display: activeTab === "contact" ? undefined : "none" }}>
              <SectionHeader num="04" label="Contact Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Mobile Number" required hint="Exactly 10 digits"><input name="mobile_number" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Enter mobile number" value={form.mobile_number} onChange={handleDigitsChange(10)} className="gs-field" style={inputStyle} /></F>
                <F label="Alternate Mobile Number" hint="Exactly 10 digits"><input name="alternate_mobile_number" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Enter alternate mobile number" value={form.alternate_mobile_number} onChange={handleDigitsChange(10)} className="gs-field" style={inputStyle} /></F>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Email" required><input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className="gs-field" style={inputStyle} /></F>
                <F label="LinkedIn Profile"><input name="linkedin_url" type="url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="gs-field" style={inputStyle} /></F>
              </div>
              <F label="Preferred Mode of Communication">
                <div style={{ display: "flex", gap: 20 }}>
                  {COMM_MODES.map((m) => (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F_BODY, fontSize: 13, color: "var(--gs-text-soft)", cursor: "pointer" }}>
                      <input type="checkbox" checked={preferredCommunication.includes(m)} onChange={() => toggle(preferredCommunication, setPreferredCommunication, m)} style={{ accentColor: "var(--gs-rust)" }} /> {m}
                    </label>
                  ))}
                </div>
              </F>
              <NextSectionButton onClick={() => setActiveTab("engagement")} />
          </div>

          <div className="space-y-5" data-tab="engagement" style={{ display: activeTab === "engagement" ? undefined : "none" }}>
              <SectionHeader num="05" label="Engagement" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Interested in Volunteering">
                  <select name="interested_volunteering" value={form.interested_volunteering} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option><option>Yes</option><option>No</option><option>Maybe</option>
                  </select>
                </F>
                <F label="Available for Network Activities">
                  <select name="available_network_activities" value={form.available_network_activities} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
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
                  <select name="availability" value={form.availability} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option>
                    <option>Weekdays</option><option>Weekends</option><option>Both</option><option>Occasionally</option>
                  </select>
                </F>
                <F label="Willing to Mentor New Volunteers">
                  <select name="willing_to_mentor_new" value={form.willing_to_mentor_new} onChange={handleChange} className="gs-field" style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">Select</option><option>Yes</option><option>No</option><option>Maybe</option>
                  </select>
                </F>
              </div>
              <NextSectionButton onClick={() => setActiveTab("additional")} />
          </div>

          <div className="space-y-5" data-tab="additional" style={{ display: activeTab === "additional" ? undefined : "none" }}>
              <SectionHeader num="06" label="Additional Information" />
              <F label="Why would you like to stay connected with Gyan Setu?"><textarea name="why_stay_connected" placeholder="Your answer" value={form.why_stay_connected} onChange={handleChange} rows={3} className="gs-field" style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Skills that you can contribute"><textarea name="skills_contribute" placeholder="Your answer" value={form.skills_contribute} onChange={handleChange} rows={3} className="gs-field" style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Any suggestions for strengthening the Alumni Network?"><textarea name="suggestions" placeholder="Your suggestions" value={form.suggestions} onChange={handleChange} rows={3} className="gs-field" style={{ ...inputStyle, resize: "vertical" }} /></F>
              <F label="Additional Remarks"><textarea name="additional_remarks" placeholder="Additional remarks" value={form.additional_remarks} onChange={handleChange} rows={3} className="gs-field" style={{ ...inputStyle, resize: "vertical" }} /></F>

              <button type="submit" disabled={status === "loading"} style={{ ...btnMarigold, marginTop: 24, cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.65 : 1 }}>
                {status === "loading" ? "Submitting..." : "Register as Alumni"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
