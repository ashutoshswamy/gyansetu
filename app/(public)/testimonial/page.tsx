"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { submitTestimonial } from "@/actions/public-forms";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, btnInk, Eyebrow } from "@/components/landing/theme";

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
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
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
      toast.success("Testimonial submitted successfully");
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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: F_MONO,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--gs-text-mute)",
    marginBottom: 7,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  if (status === "success") {
    return (
      <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ position: "relative", maxWidth: 560, width: "100%", background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 4, padding: "40px 36px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "1.5px dashed var(--gs-rust)", opacity: 0.55 }} />
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(232,163,61,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gs-rust)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 10px" }}>Testimonial Submitted</h2>
          <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-soft)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you! Your testimonial has been submitted for review.
          </p>
          <Link href="/" style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-rust)", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 500, color: "var(--gs-text-mute)", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div style={{ position: "relative", background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 4, padding: "36px 32px" }}>
          {/* Postmark corner */}
          <div style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "1.5px dashed var(--gs-rust)", opacity: 0.55 }} />

          <div style={{ marginBottom: 28 }}>
            <Eyebrow>Share Your Story</Eyebrow>
            <div style={{ color: "var(--gs-marigold)", fontFamily: F_DISPLAY, fontSize: 34, lineHeight: 0.5, fontWeight: 700, marginBottom: 10 }}>&ldquo;</div>
            <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: "0 0 8px" }}>
              Submit a Testimonial
            </h1>
            <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-soft)", margin: 0, lineHeight: 1.6 }}>
              Tell us about your experience with Gyan Setu. All testimonials are reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label htmlFor="name" style={labelStyle}>Full Name <span style={{ color: "var(--gs-rust)" }}>*</span></label>
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
              <label htmlFor="message" style={labelStyle}>Your Experience <span style={{ color: "var(--gs-rust)" }}>*</span></label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={250}
                value={form.message}
                onChange={handleChange}
                placeholder="Share your experience..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              />
              <p style={{ fontFamily: F_MONO, fontSize: 11, color: "var(--gs-text-mute)", marginTop: 6, textAlign: "right" }}>
                {form.message.length}/250
              </p>
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(184,73,46,0.06)", border: "1px solid rgba(184,73,46,0.25)", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontFamily: F_BODY, fontSize: 13, color: "var(--gs-rust)", margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                ...btnInk,
                width: "100%",
                justifyContent: "center",
                opacity: status === "loading" ? 0.6 : 1,
                cursor: status === "loading" ? "not-allowed" : "pointer",
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
