"use client";

import React, { useState } from "react";
import Link from "next/link";
import { submitInstitutionInquiry } from "@/actions/public-forms";

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
    if (!form.institution_name.trim() || !form.contact_name.trim() || !form.email.trim()) return;
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    color: "#19140F",
    background: "#FAFAF7",
    border: "1.5px solid #E4DFD1",
    borderRadius: 8,
    outline: "none",
    fontFamily: "Poppins, sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#5A5247",
    marginBottom: 6,
    letterSpacing: "0.02em",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 560, width: "100%", background: "white", border: "1px solid #E4DFD1", borderRadius: 14, padding: "40px 36px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(42,94,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A5E3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#19140F", margin: "0 0 10px" }}>Application Received</h2>
          <p style={{ fontSize: 14, color: "#5A5247", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you for your interest in partnering with Gyan Setu. Our team will review your application and be in touch shortly.
          </p>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#4A55BE", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#9B9188", textDecoration: "none", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 14, padding: "36px 32px" }}>
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", margin: "0 0 6px" }}>
              Institutional Partnership
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: "0 0 6px", fontFamily: "var(--font-cormorant), serif" }}>
              Apply as an Institution
            </h1>
            <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>
              Partner with Gyan Setu to bring Jnana Pravas tours and science enrichment programmes to your students.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label htmlFor="institution_name" style={labelStyle}>Institution Name <span style={{ color: "#C0392B" }}>*</span></label>
              <input
                id="institution_name"
                name="institution_name"
                type="text"
                required
                value={form.institution_name}
                onChange={handleChange}
                placeholder="e.g. Kendriya Vidyalaya, IIT Bombay"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="contact_name" style={labelStyle}>Contact Person Name <span style={{ color: "#C0392B" }}>*</span></label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={handleChange}
                placeholder="Full name"
                style={inputStyle}
              />
            </div>

            <div className="form-row-2" style={{ marginBottom: 18 }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Email <span style={{ color: "#C0392B" }}>*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
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
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
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
                placeholder="Tell us about your institution's goals and how you'd like to work with Gyan Setu..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 7, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                background: status === "loading" ? "#9B9188" : "#4A55BE",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontFamily: "Poppins, sans-serif",
                transition: "background 0.15s",
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
