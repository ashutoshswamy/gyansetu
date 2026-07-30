"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { submitInstitutionInquiry } from "@/actions/public-forms";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, btnMarigold, Eyebrow } from "@/components/landing/theme";

export default function InstitutionPage() {
  const [form, setForm] = useState({
    institution_name: "",
    contact_name: "",
    email: "",
    phone: "",
    institution_type: "",
    city: "",
    student_count: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.institution_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitInstitutionInquiry({
        institution_name: form.institution_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        institution_type: form.institution_type || undefined,
        city: form.city.trim() || undefined,
        student_count: form.student_count || undefined,
        message: form.message.trim() || undefined,
      });
      setStatus("success");
      toast.success("Application submitted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    color: "var(--gs-text)",
    background: "var(--gs-paper)",
    border: "1.5px solid var(--gs-line)",
    borderRadius: 4,
    outline: "none",
    fontFamily: F_BODY,
    boxSizing: "border-box",
    transition: "border-color .15s",
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    e.currentTarget.style.borderColor = "var(--gs-rust)";
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    e.currentTarget.style.borderColor = "var(--gs-line)";
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: F_MONO,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--gs-text-mute)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 7,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  if (status === "success") {
    return (
      <div
        className={fontVars}
        style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper-deep)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      >
        <div style={{ maxWidth: 560, width: "100%", background: "var(--gs-paper)", border: "1px solid var(--gs-line)", borderRadius: 6, padding: "40px 36px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(184,73,46,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gs-rust)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 10px" }}>Application Received</h2>
          <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-soft)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you for your interest in partnering with Gyan Setu. Our team will review your application and be in touch shortly.
          </p>
          <Link href="/" style={btnMarigold}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={fontVars}
      style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper-deep)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}
    >
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ fontFamily: F_MONO, fontSize: 11.5, fontWeight: 600, color: "var(--gs-text-mute)", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div style={{ background: "var(--gs-paper)", border: "1px solid var(--gs-line)", borderRadius: 6, padding: "36px 32px" }}>
          <div style={{ marginBottom: 28 }}>
            <Eyebrow>Institutional Partnership</Eyebrow>
            <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--gs-text)", margin: "0 0 8px" }}>
              Apply as an Institution
            </h1>
            <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-soft)", lineHeight: 1.65, margin: 0 }}>
              Partner with Gyan Setu to bring Jnana Pravas tours and science enrichment programmes to your students.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label htmlFor="institution_name" style={labelStyle}>Institution Name <span style={{ color: "var(--gs-rust)" }}>*</span></label>
              <input
                id="institution_name"
                name="institution_name"
                type="text"
                required
                value={form.institution_name}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="e.g. Kendriya Vidyalaya, IIT Bombay"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="contact_name" style={labelStyle}>Contact Person Name <span style={{ color: "var(--gs-rust)" }}>*</span></label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Full name"
                style={inputStyle}
              />
            </div>

            <div className="form-row-2" style={{ marginBottom: 18 }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Email <span style={{ color: "var(--gs-rust)" }}>*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="contact@institution.edu"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="phone" style={labelStyle}>Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); handleChange(e); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="10-digit phone number"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="form-row-2" style={{ marginBottom: 18 }}>
              <div>
                <label htmlFor="institution_type" style={labelStyle}>Institution Type</label>
                <select
                  id="institution_type"
                  name="institution_type"
                  value={form.institution_type}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="">Select</option>
                  <option value="School">School</option>
                  <option value="Junior College">Junior College</option>
                  <option value="Degree College">Degree College</option>
                  <option value="University">University</option>
                  <option value="Research Institute">Research Institute</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="city" style={labelStyle}>City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="e.g. Pune"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="student_count" style={labelStyle}>Approximate Number of Students</label>
              <select
                id="student_count"
                name="student_count"
                value={form.student_count}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, appearance: "none" }}
              >
                <option value="">Select</option>
                <option value="Under 100">Under 100</option>
                <option value="100–500">100–500</option>
                <option value="500–1000">500–1,000</option>
                <option value="1000–5000">1,000–5,000</option>
                <option value="5000+">5,000+</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="message" style={labelStyle}>How do you want to collaborate?</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Tell us about your institution's goals and how you'd like to work with Gyan Setu..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(184,73,46,.08)", border: "1px dashed var(--gs-rust)", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontFamily: F_BODY, fontSize: 13, color: "var(--gs-rust)", margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                ...btnMarigold,
                width: "100%",
                justifyContent: "center",
                fontSize: 14,
                padding: "13px 24px",
                background: status === "loading" ? "var(--gs-text-mute)" : "var(--gs-marigold)",
                cursor: status === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
