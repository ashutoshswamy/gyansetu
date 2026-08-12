"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { issueCertificate } from "@/actions/certificates";
import { getLatestIdCardForVolunteer } from "@/actions/id-cards";
import { getCurrentTourForVolunteer } from "@/actions/groups";
import type { CertificateType } from "@/types";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const NO_TOUR = "__general__";

const CERT_TYPES = ["participation", "excellence", "leadership", "mentor"] as const;

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");
  const [tourId, setTourId] = useState("");
  const [idCard, setIdCard] = useState<{ card_number: string; state?: string | null; place?: string | null; valid_from?: string; valid_to?: string } | null>(null);
  const [idCardChecked, setIdCardChecked] = useState(false);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [durationDays, setDurationDays] = useState("");
  const [place, setPlace] = useState("");
  const [lastIdCard, setLastIdCard] = useState(idCard);

  // Default the duration from the ID card's validity span (inclusive day count) — admin can
  // still override for partial attendance, but the card is the source of truth for the visit.
  if (idCard !== lastIdCard) {
    setLastIdCard(idCard);
    if (!idCard?.valid_from || !idCard?.valid_to) {
      setDurationDays("");
    } else {
      const days = Math.round((new Date(idCard.valid_to).getTime() - new Date(idCard.valid_from).getTime()) / 86400000) + 1;
      setDurationDays(days > 0 ? String(days) : "");
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/tours").then(r => r.json()),
    ]).then(([toursData]) => {
      setTours(Array.isArray(toursData) ? toursData : []);
    });
    // Fetch volunteers from supabase via a simple endpoint
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  const fetchKey = `${volunteerId}:${tourId}`;
  const [lastFetchKey, setLastFetchKey] = useState(fetchKey);
  if (fetchKey !== lastFetchKey) {
    setLastFetchKey(fetchKey);
    setIdCard(null);
    setIdCardChecked(false);
  }

  useEffect(() => {
    if (!volunteerId) return;
    let cancelled = false;
    getLatestIdCardForVolunteer(volunteerId, tourId || undefined).then(card => {
      if (cancelled) return;
      setIdCard(card ?? null);
      setIdCardChecked(true);
    });
    return () => { cancelled = true; };
  }, [volunteerId, tourId]);

  function handleVolunteerChange(id: string) {
    setVolunteerId(id);
    if (!id) return;
    getCurrentTourForVolunteer(id).then(info => {
      if (info?.tour_id) setTourId(info.tour_id);
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const rawTourId = fd.get("tour_id") as string;
      const cert = await issueCertificate({
        user_id: fd.get("user_id") as string,
        tour_id: rawTourId && rawTourId !== NO_TOUR ? rawTourId : undefined,
        certificate_type: fd.get("certificate_type") as CertificateType,
        notes: fd.get("notes") as string || undefined,
        state: fd.get("state") as string || undefined,
        place: fd.get("place") as string || undefined,
        duration_of_visit: durationDays ? `${durationDays} Day${durationDays === "1" ? "" : "s"}` : undefined,
        volunteer_code: fd.get("volunteer_code") as string || undefined,
      });
      router.push(`/admin/certificates/${cert.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to issue certificate";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Issue Certificate</h1>
        </div>
        <Card>
<CardContent>
<form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <Label className="mb-1.5">Volunteer <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={handleVolunteerChange} name="user_id" />
            </div>
            <div>
              <Label className="mb-1.5">Certificate Type <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <Select
                name="certificate_type"
                defaultValue={CERT_TYPES[0]}
                items={CERT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Tour (optional)</Label>
              <Select
                name="tour_id"
                value={tourId || NO_TOUR}
                onValueChange={(v) => setTourId(v === NO_TOUR ? "" : (v ?? ""))}
                items={[{ value: NO_TOUR, label: "General (no specific tour)" }, ...tours.map(t => ({ value: t.id, label: t.title }))]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="General (no specific tour)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TOUR}>General (no specific tour)</SelectItem>
                  {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {volunteerId && idCardChecked && !idCard && (
              <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "var(--gs-danger)" }}>
                No ID card found for this volunteer{tourId ? " on this tour" : ""}. Generate their ID card first &mdash;
                State and Volunteer ID are filled in automatically from it.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">State/Union Territory</Label>
                <Input name="state" value={idCard?.state ?? ""} readOnly placeholder="From volunteer's ID card" className="bg-[#F0EEE6] text-[var(--gs-text-secondary)]" />
              </div>
              <div>
                <Label className="mb-1.5">Place</Label>
                <Input name="place" value={place} onChange={e => setPlace(e.target.value)} placeholder="Enter place" />
              </div>
              <div>
                <Label className="mb-1.5">Duration of Visit (days)</Label>
                <Input
                  name="duration_of_visit_days"
                  type="number"
                  min={1}
                  step={1}
                  value={durationDays}
                  onChange={e => setDurationDays(e.target.value)}
                  placeholder="From ID card validity"
                />
              </div>
              <div>
                <Label className="mb-1.5">Volunteer ID</Label>
                <Input name="volunteer_code" value={idCard?.card_number ?? ""} readOnly placeholder="From volunteer's ID card" className="bg-[#F0EEE6] text-[var(--gs-text-secondary)]" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea name="notes" rows={3} placeholder="Reason for certificate, achievements..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Issuing..." : "Issue Certificate"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
</CardContent>
</Card>
      </div>
    </div>
  );
}
