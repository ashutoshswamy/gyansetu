"use client";

import React, { useState } from "react";
import Link from "next/link";
import { submitTestimonial } from "@/actions/public-forms";

export default function TestimonialPage() {
  const [form, setForm] = useState({
    name: "",
    batch_year: "",
    role: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitTestimonial({
        name: form.name.trim(),
        batch_year: form.batch_year.trim() || undefined,
        role: form.role.trim() || undefined,
        message: form.message.trim(),
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
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#19140F", margin: "0 0 10px" }}>Testimonial Submitted</h2>
          <p style={{ fontSize: 14, color: "#5A5247", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you! Your testimonial has been submitted for review.
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
              Share Your Story
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: "0 0 6px", fontFamily: "var(--font-cormorant), serif" }}>
              Submit a Testimonial
            </h1>
            <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>
              Tell us about your experience with Gyan Setu. All testimonials are reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
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

            <div style={fieldStyle}>
              <label htmlFor="batch_year" style={labelStyle}>Batch Year</label>
              <input
                id="batch_year"
                name="batch_year"
                type="text"
                value={form.batch_year}
                onChange={handleChange}
                placeholder="e.g. 2019–20"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="role" style={labelStyle}>Your Role During Tour</label>
              <input
                id="role"
                name="role"
                type="text"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Volunteer, Rajasthan 2019"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="message" style={labelStyle}>Your Experience <span style={{ color: "#C0392B" }}>*</span></label>
              <textarea
                id="message"
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                placeholder="Share your experience..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
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
              {status === "loading" ? "Submitting..." : "Submit Testimonial"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
