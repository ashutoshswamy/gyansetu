"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { submitInstitutionInquiry } from "@/actions/public-forms";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, btnMarigold, Eyebrow } from "@/components/landing/theme";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const INSTITUTION_TYPES = ["School", "Junior College", "Degree College", "University", "Research Institute", "Other"];
const STUDENT_COUNTS = ["Under 100", "100–500", "500–1000", "1000–5000", "5000+"];

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function setField(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
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
              <Input
                id="institution_name"
                name="institution_name"
                type="text"
                required
                value={form.institution_name}
                onChange={handleChange}
                placeholder="e.g. Kendriya Vidyalaya, IIT Bombay"
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="contact_name" style={labelStyle}>Contact Person Name <span style={{ color: "var(--gs-rust)" }}>*</span></label>
              <Input
                id="contact_name"
                name="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={handleChange}
                placeholder="Full name"
              />
            </div>

            <div className="form-row-2" style={{ marginBottom: 18 }}>
              <div>
                <label htmlFor="email" style={labelStyle}>Email <span style={{ color: "var(--gs-rust)" }}>*</span></label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@institution.edu"
                />
              </div>
              <div>
                <label htmlFor="phone" style={labelStyle}>Phone</label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); handleChange(e); }}
                  placeholder="10-digit phone number"
                />
              </div>
            </div>

            <div className="form-row-2" style={{ marginBottom: 18 }}>
              <div>
                <label htmlFor="institution_type" style={labelStyle}>Institution Type</label>
                <Select name="institution_type" value={form.institution_type || undefined} onValueChange={(v) => setField("institution_type", v ?? "")}>
                  <SelectTrigger id="institution_type" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="city" style={labelStyle}>City</label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Pune"
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="student_count" style={labelStyle}>Approximate Number of Students</label>
              <Select name="student_count" value={form.student_count || undefined} onValueChange={(v) => setField("student_count", v ?? "")}>
                <SelectTrigger id="student_count" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_COUNTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="message" style={labelStyle}>How do you want to collaborate?</label>
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your institution's goals and how you'd like to work with Gyan Setu..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(184,73,46,.08)", border: "1px dashed var(--gs-rust)", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontFamily: F_BODY, fontSize: 13, color: "var(--gs-rust)", margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full justify-center text-sm py-3 font-bold bg-[#D97706] hover:bg-[#B45309] text-white"
            >
              {status === "loading" ? "Submitting Inquiry..." : "Submit Institution Inquiry →"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
