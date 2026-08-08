"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createIdCard } from "@/actions/id-cards";
import { getGroupsByTour, getCurrentTourForVolunteer } from "@/actions/groups";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Group = { id: string; name: string; state_allocated?: string | null; tour_group_members?: { users?: { id: string } | null }[] };

export default function NewIdCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string; volunteer_profiles?: { photo_url?: string } | null }[]>([]);
  const [volunteerId, setVolunteerId] = useState("");
  const selectedPhoto = volunteers.find(v => v.id === volunteerId)?.volunteer_profiles?.photo_url;
  const [tours, setTours] = useState<{ id: string; title: string; destination: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  // State isn't admin-typed — it comes from the group's allocated state, same as the
  // certificate form pulls its fields from the ID card. Place is admin-typed (below),
  // defaulted from the tour's destination when a tour is picked but freely editable.
  const [place, setPlace] = useState("");
  const state = groups.find(g => g.id === groupId)?.state_allocated ?? "";

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  function autoMatchGroup(list: Group[], forVolunteerId: string) {
    return list.find(g => g.tour_group_members?.some(m => m.users?.id === forVolunteerId));
  }

  useEffect(() => {
    if (!tourId) return;
    getGroupsByTour(tourId).then(g => {
      const list = g as Group[];
      setGroups(list);
      const match = autoMatchGroup(list, volunteerId);
      if (match) setGroupId(match.id);
    }).catch(() => setGroups([]));
    // Only refetch when the tour changes — volunteer changes are handled by handleVolunteerChange below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  function handleTourChange(id: string) {
    setTourId(id);
    setGroupId("");
    setGroups([]);
    setPlace(tours.find(t => t.id === id)?.destination ?? "");
  }

  function handleVolunteerChange(id: string) {
    setVolunteerId(id);
    const match = autoMatchGroup(groups, id);
    if (match) setGroupId(match.id);
    if (!id) return;
    getCurrentTourForVolunteer(id).then(info => {
      if (info?.tour_id && info.tour_id !== tourId) handleTourChange(info.tour_id);
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createIdCard({
        volunteer_id: fd.get("volunteer_id") as string,
        tour_id: fd.get("tour_id") as string,
        group_id: (fd.get("group_id") as string) || undefined,
        valid_from: fd.get("valid_from") as string,
        valid_to: fd.get("valid_to") as string,
        state: state || undefined,
        place: place || undefined,
      });
      router.push("/admin/id-cards");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to issue ID card";
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Issue ID Card</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <Label className="mb-1.5">Volunteer <span className="text-destructive">*</span></Label>
              <VolunteerCombobox volunteers={volunteers} value={volunteerId} onChange={handleVolunteerChange} name="volunteer_id" />
              {volunteerId && (
                selectedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPhoto} alt="Profile photo" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", marginTop: 8, border: "1px solid var(--border)" }} />
                ) : (
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", marginTop: 6 }}>No profile photo uploaded by this volunteer yet — the card will show no photo unless one is added below.</p>
                )
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Tour <span className="text-destructive">*</span></Label>
                <Select name="tour_id" required value={tourId} onValueChange={v => handleTourChange(v ?? "")}>
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
                <Select name="group_id" value={groupId} onValueChange={v => setGroupId(v ?? "")} disabled={!tourId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No group / General" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>Card number is generated automatically from the tour, group, and issue sequence.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">State/Union Territory</Label>
                <Input name="state" value={state} readOnly placeholder="From group's allocated state" className="bg-muted text-muted-foreground" />
              </div>
              <div>
                <Label className="mb-1.5">Place</Label>
                <Input name="place" value={place} onChange={e => setPlace(e.target.value)} placeholder="Enter place" />
              </div>
            </div>
            {tourId && !groupId && (
              <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>No group selected — State stays blank until one is assigned (group carries the allocated state).</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5">Valid From <span className="text-destructive">*</span></Label>
                <Input name="valid_from" type="date" required />
              </div>
              <div>
                <Label className="mb-1.5">Valid To <span className="text-destructive">*</span></Label>
                <Input name="valid_to" type="date" required />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Issuing..." : "Issue ID Card"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
