"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { submitAlumniRegistration } from "@/actions/alumni-registration";

export function AlumniSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    batch_year: "",
    tour_destination: "",
    role_during_tour: "",
    highlights: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitAlumniRegistration({
        name: form.name.trim(),
        email: form.email.trim(),
        batch_year: form.batch_year || undefined,
        tour_destination: form.tour_destination.trim() || undefined,
        role_during_tour: form.role_during_tour || undefined,
        highlights: form.highlights.trim() || undefined,
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
    background: "white",
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

  return (
    <section id="alumni" style={{ background: "white", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "flex-start" }} className="career-grid">

          {/* Left: info */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
              Alumni Network
            </span>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--lp-text)", margin: "0 0 20px" }}>
              Once a Jnanaprabodhini,<br />
              <span style={{ color: "var(--lp-navy)", fontStyle: "italic" }}>Always a Jnanaprabodhini</span>
            </h2>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15.5, color: "var(--lp-ts)", lineHeight: 1.75, marginBottom: 28 }}>
              If you&apos;ve been part of a Gyan Setu tour, you&apos;re part of a lifelong community. Register as an alumni to reconnect, share your journey, and help guide the next generation of volunteers.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Stay connected with your tour cohort",
                "Mentor incoming volunteers",
                "Get invited to alumni events & reunions",
                "Contribute to science outreach nationwide",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(42,94,58,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#2A5E3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "var(--lp-ts)" }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 0.68, 0, 1.2] }}
          >
            {status === "success" ? (
              <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: 14, padding: "40px 32px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(42,94,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A5E3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#19140F", margin: "0 0 10px", fontFamily: "var(--font-cormorant), serif" }}>Registration Received!</h3>
                <p style={{ fontSize: 13, color: "#5A5247", lineHeight: 1.65, margin: 0 }}>
                  Welcome back to the Gyan Setu family. A confirmation email is on its way to your inbox.
                </p>
              </div>
            ) : (
              <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: 14, padding: "32px 28px" }}>
                <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 700, color: "#19140F", margin: "0 0 20px" }}>Alumni Registration</h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>Full Name <span style={{ color: "#C0392B" }}>*</span></label>
                      <input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Your name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email <span style={{ color: "#C0392B" }}>*</span></label>
                      <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>Batch Year</label>
                      <select name="batch_year" value={form.batch_year} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                        <option value="">Select year</option>
                        {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Role During Tour</label>
                      <select name="role_during_tour" value={form.role_during_tour} onChange={handleChange} style={{ ...inputStyle, appearance: "none" }}>
                        <option value="">Select role</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Group Leader">Group Leader</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Participant">Participant</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Tour Destination</label>
                    <input name="tour_destination" type="text" value={form.tour_destination} onChange={handleChange} placeholder="e.g. Rajasthan, Northeast India" style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Your Highlights & Memories</label>
                    <textarea name="highlights" value={form.highlights} onChange={handleChange} placeholder="Share what made your tour unforgettable..." rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
                  </div>

                  {status === "error" && (
                    <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 7, padding: "10px 14px", marginBottom: 14 }}>
                      <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    style={{
                      width: "100%",
                      background: status === "loading" ? "#9B9188" : "var(--lp-navy)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "12px 24px",
                      borderRadius: 8,
                      border: "none",
                      cursor: status === "loading" ? "not-allowed" : "pointer",
                      fontFamily: "Poppins, sans-serif",
                      transition: "background 0.15s",
                    }}
                  >
                    {status === "loading" ? "Submitting..." : "Register as Alumni"}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
