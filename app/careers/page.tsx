"use client";

import React, { useState } from "react";
import Link from "next/link";
import { submitCareerInquiry } from "@/actions/public-forms";

export default function CareersPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    experience_years: "",
    area_of_interest: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitCareerInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        qualification: form.qualification.trim() || undefined,
        experience_years: form.experience_years || undefined,
        area_of_interest: form.area_of_interest || undefined,
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
            We&apos;ve received your application. Our team will review it and contact you.
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
              Join Our Team
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: "0 0 6px", fontFamily: "var(--font-cormorant), serif" }}>
              Careers at Gyan Setu
            </h1>
            <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>
              Be part of a mission to transform student learning through immersive experiences.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label htmlFor="name" style={labelStyle}>Full Name <span style={{ color: "#C0392B" }}>*</span></label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="email" style={labelStyle}>Email <span style={{ color: "#C0392B" }}>*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
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
              <div>
                <label htmlFor="qualification" style={labelStyle}>Qualification</label>
                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  value={form.qualification}
                  onChange={handleChange}
                  placeholder="e.g. B.Sc., M.A. Education"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label htmlFor="experience_years" style={labelStyle}>Years of Experience</label>
                <select
                  id="experience_years"
                  name="experience_years"
                  value={form.experience_years}
                  onChange={handleChange}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="">Select</option>
                  <option value="Fresher">Fresher</option>
                  <option value="1–2 years">1–2 years</option>
                  <option value="3–5 years">3–5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
              <div>
                <label htmlFor="area_of_interest" style={labelStyle}>Area of Interest</label>
                <select
                  id="area_of_interest"
                  name="area_of_interest"
                  value={form.area_of_interest}
                  onChange={handleChange}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="">Select</option>
                  <option value="Teaching & Education">Teaching &amp; Education</option>
                  <option value="Science Communication">Science Communication</option>
                  <option value="Programme Coordination">Programme Coordination</option>
                  <option value="Research">Research</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="message" style={labelStyle}>Why do you want to join?</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us what motivates you to join Gyan Setu..."
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
