"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { submitSponsorInquiry } from "@/actions/public-forms";
import {
  fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO,
  btnMarigold, Eyebrow,
} from "@/components/landing/theme";

export default function SponsorPage() {
  const [form, setForm] = useState({
    organization_name: "",
    contact_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.organization_name.trim() || !form.contact_name.trim() || !form.email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitSponsorInquiry({
        organization_name: form.organization_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      setStatus("success");
      toast.success("Inquiry submitted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
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
    marginBottom: 8,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  if (status === "success") {
    return (
      <div style={{ ...pageVars, minHeight: "100vh", background: "var(--gs-paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} className={fontVars}>
        <div style={{ maxWidth: 560, width: "100%", background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "44px 36px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(184,73,46,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={22} color="var(--gs-rust)" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 10px" }}>Inquiry Received</h2>
          <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-soft)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you for your interest in sponsoring Gyan Setu. We&apos;ll be in touch shortly.
          </p>
          <Link href="/" style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gs-rust)", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageVars, minHeight: "100vh", background: "var(--gs-paper)" }} className={fontVars}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ fontFamily: F_MONO, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gs-text-mute)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={13} />
            Back to Home
          </Link>
        </div>

        <Eyebrow>Partnerships</Eyebrow>
        <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(30px,4.5vw,44px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: "0 0 14px" }}>
          Be a Sponsor,{" "}
          <span style={{ color: "var(--gs-rust)", fontStyle: "italic" }}>Shape Young India</span>
        </h1>
        <p style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-soft)", lineHeight: 1.7, margin: "0 0 32px" }}>
          Your sponsorship powers activity-based learning workshops in remote schools, supports volunteer travel, and helps bridge knowledge gaps across India.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
          {[
            { num: "1,688", label: "Schools Reached" },
            { num: "14", label: "States & UT" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 4, padding: "18px 20px" }}>
              <div style={{ fontFamily: F_MONO, fontSize: 28, fontWeight: 600, color: "var(--gs-rust)", lineHeight: 1, marginBottom: 6 }}>{stat.num}</div>
              <div style={{ fontFamily: F_BODY, fontSize: 12.5, fontWeight: 600, color: "var(--gs-text)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "32px 28px" }}>
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label htmlFor="organization_name" style={labelStyle}>Organization Name <span style={{ color: "var(--gs-rust)" }}>*</span></label>
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                required
                value={form.organization_name}
                onChange={handleChange}
                placeholder="Your organization's name"
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
                  placeholder="email@organization.com"
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
                  placeholder="10-digit phone number"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="message" style={labelStyle}>Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more about your sponsorship interest..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(184,73,46,.06)", border: "1px dashed var(--gs-rust)", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
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
                opacity: status === "loading" ? 0.6 : 1,
                cursor: status === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? "Submitting..." : "Submit Inquiry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
