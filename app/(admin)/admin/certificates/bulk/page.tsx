"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkIssueCertificates } from "@/actions/certificates";
import { getGroupsByTour } from "@/actions/groups";
import { VolunteerChecklist } from "@/components/features/volunteers/volunteer-checklist";
import type { CertificateType } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const CERT_TYPES: CertificateType[] = ["participation", "excellence", "leadership", "mentor"];

const NO_GROUP = "__all__";

type Volunteer = { id: string; name: string; email: string };
type Group = { id: string; name: string; tour_group_members?: { users?: Volunteer | null }[] };

export default function BulkCertificatesPage() {
  const router = useRouter();
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [certificateType, setCertificateType] = useState<CertificateType | "">("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [durationDays, setDurationDays] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!tourId) return;
    getGroupsByTour(tourId).then(g => setGroups(g as Group[])).catch(() => setGroups([]));
    fetch(`/api/volunteers?tourId=${tourId}`).then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, [tourId]);

  function handleTourChange(id: string) {
    setTourId(id);
    setGroupId("");
    setGroups([]);
    setVolunteers([]);
    setSelected(new Set());
  }

  const selectedGroup = groups.find(g => g.id === groupId);
  const roster = groupId
    ? (selectedGroup?.tour_group_members ?? []).map(m => m.users).filter((u): u is Volunteer => !!u)
    : volunteers;

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tourId) { fail("Select a tour."); return; }
    if (!certificateType) { fail("Select a certificate category."); return; }
    if (selected.size === 0) { fail("Select at least one volunteer."); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await bulkIssueCertificates({
        tour_id: tourId,
        certificate_type: certificateType,
        volunteer_ids: Array.from(selected),
        notes: notes || undefined,
        duration_of_visit: durationDays ? `${durationDays} Day${durationDays === "1" ? "" : "s"}` : undefined,
      });
      const parts = [`${result.issued} certificate${result.issued === 1 ? "" : "s"} issued`];
      if (result.skipped) parts.push(`${result.skipped} already had one`);
      if (result.skippedNoIdCard.length) parts.push(`${result.skippedNoIdCard.length} skipped (no ID card yet)`);
      if (result.failed.length) parts.push(`${result.failed.length} failed`);
      if (result.failed.length || result.skippedNoIdCard.length) toast.error(parts.join(", ")); else toast.success(parts.join(", "));
      router.push("/admin/certificates");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Failed to bulk issue certificates");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Bulk Issue Certificates</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Pick a tour, optionally narrow to one group, choose a category, select volunteers, and issue certificates to all of them at once.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Tour <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
                <Select
                  value={tourId || null}
                  onValueChange={(v) => handleTourChange(v ?? "")}
                  items={tours.map(t => ({ value: t.id, label: t.title }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tour..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5">Certificate Category <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
                <Select
                  value={certificateType || null}
                  onValueChange={(v) => setCertificateType((v as CertificateType) ?? "")}
                  items={CERT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Group</Label>
              <Select
                value={groupId || NO_GROUP}
                onValueChange={(v) => { setGroupId(v === NO_GROUP ? "" : (v ?? "")); setSelected(new Set()); }}
                disabled={!tourId}
                items={[{ value: NO_GROUP, label: "All applied volunteers" }, ...groups.map(g => ({ value: g.id, label: g.name }))]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All applied volunteers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>All applied volunteers</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>
              State, Place, and Volunteer ID are pulled from each volunteer&apos;s ID card for this tour &mdash; anyone without one is skipped.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Duration of Visit (days)</Label>
                <Input type="number" min={1} step={1} value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reason for certificate, achievements... (applied to all)" />
            </div>
            <div>
              <Label className="mb-1.5">Volunteers <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <VolunteerChecklist volunteers={roster} selected={selected} onChange={setSelected} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading || selected.size === 0}>
              {loading ? "Issuing..." : selected.size ? `Issue ${selected.size} Certificate${selected.size === 1 ? "" : "s"}` : "Issue Certificates"}
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
