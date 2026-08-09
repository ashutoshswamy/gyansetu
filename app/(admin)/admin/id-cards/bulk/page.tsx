"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkCreateIdCards } from "@/actions/id-cards";
import { getGroupsByTour } from "@/actions/groups";
import { VolunteerChecklist } from "@/components/features/volunteers/volunteer-checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Volunteer = { id: string; name: string; email: string };
type Group = {
  id: string;
  name: string;
  state_allocated?: string | null;
  tour_group_members?: { users?: Volunteer | null }[];
};

export default function BulkIdCardsPage() {
  const router = useRouter();
  const [tours, setTours] = useState<{ id: string; title: string; destination: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [place, setPlace] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
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
    setPlace(tours.find(t => t.id === id)?.destination ?? "");
  }

  const selectedGroup = groups.find(g => g.id === groupId);
  const state = selectedGroup?.state_allocated ?? "";

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
    if (selected.size === 0) { fail("Select at least one volunteer."); return; }
    if (!validFrom || !validTo) { fail("Set the validity window."); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await bulkCreateIdCards({
        tour_id: tourId,
        group_id: groupId || undefined,
        volunteer_ids: Array.from(selected),
        valid_from: validFrom,
        valid_to: validTo,
        state: state || undefined,
        place: place || undefined,
      });
      const parts = [`${result.issued} card${result.issued === 1 ? "" : "s"} issued`];
      if (result.skipped) parts.push(`${result.skipped} already had one`);
      if (result.failed.length) parts.push(`${result.failed.length} failed`);
      if (result.failed.length) toast.error(parts.join(", ")); else toast.success(parts.join(", "));
      router.push("/admin/id-cards");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Failed to bulk issue ID cards");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Bulk Issue ID Cards</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Pick a tour, optionally narrow to one group, select volunteers, and issue cards to all of them at once.</p>
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
                <Label className="mb-1.5">Tour <span className="text-destructive">*</span></Label>
                <Select value={tourId} onValueChange={v => handleTourChange(v ?? "")} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tour..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5">Group</Label>
                <Select value={groupId} onValueChange={v => { setGroupId(v ?? ""); setSelected(new Set()); }} disabled={!tourId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All applied volunteers" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>
              Card numbers are generated automatically per volunteer. State comes from the group&apos;s allocated state.
            </p>
            <div>
              <Label className="mb-1.5">Place</Label>
              <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="Enter place" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Valid From <span className="text-destructive">*</span></Label>
                <Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1.5">Valid To <span className="text-destructive">*</span></Label>
                <Input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Volunteers <span className="text-destructive">*</span></Label>
              <VolunteerChecklist volunteers={roster} selected={selected} onChange={setSelected} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading || selected.size === 0}>
              {loading ? "Issuing..." : selected.size ? `Issue ${selected.size} Card${selected.size === 1 ? "" : "s"}` : "Issue Cards"}
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
