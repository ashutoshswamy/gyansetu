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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    if (!form.organization_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setErrorMsg("Please fill in all required fields.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      await submitSponsorInquiry(form);
      setStatus("success");
      toast.success("Sponsorship inquiry submitted!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit inquiry.";
      setErrorMsg(message);
      setStatus("error");
      toast.error(message);
    }
  }

  if (status === "success") {
    return (
      <div style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)", color: "var(--gs-ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }} className={fontVars}>
        <div style={{ maxWidth: 520, width: "100%", background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(34,139,34,.12)", border: "1.5px solid var(--gs-forest)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={24} style={{ color: "var(--gs-forest)" }} />
          </div>
          <h2 style={{ fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Inquiry Submitted!</h2>
          <p style={{ fontSize: 14, color: "var(--gs-ink-light)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Thank you for your interest in sponsoring Gyan-Setu. Our team will review your details and reach out shortly.
          </p>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button className="w-full font-bold bg-[#D97706] hover:bg-[#B45309] text-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)", color: "var(--gs-ink)", padding: "40px 20px 80px" }} className={fontVars}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--gs-ink-light)", textDecoration: "none", marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <Eyebrow>Partner With Us</Eyebrow>
          <h1 style={{ fontFamily: F_DISPLAY, fontSize: 32, fontWeight: 700, color: "var(--gs-ink)", margin: "8px 0 12px" }}>
            Sponsor Gyan-Setu
          </h1>
          <p style={{ fontSize: 15, color: "var(--gs-ink-light)", lineHeight: 1.6, margin: 0 }}>
            Help us bring hands-on science and education to remote, tribal and aspirational regions of India. Fill out the form below and our partnerships team will get in touch.
          </p>
        </div>

        <div style={{ background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 6, padding: "32px 28px" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="organization_name" className="text-xs font-semibold text-muted-foreground">Organization Name <span className="text-destructive">*</span></Label>
              <Input
                id="organization_name"
                name="organization_name"
                type="text"
                required
                value={form.organization_name}
                onChange={handleChange}
                placeholder="Your organization's name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_name" className="text-xs font-semibold text-muted-foreground">Contact Person Name <span className="text-destructive">*</span></Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@organization.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Phone</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-semibold text-muted-foreground">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more about your sponsorship interest..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>

            {status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full justify-center text-sm py-3 font-bold bg-[#D97706] hover:bg-[#B45309] text-white"
            >
              {status === "loading" ? "Submitting Inquiry..." : "Submit Sponsorship Inquiry →"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
