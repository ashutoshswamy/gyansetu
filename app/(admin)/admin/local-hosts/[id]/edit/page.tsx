"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLocalHost, updateLocalHost } from "@/actions/local-hosts";
import { getAllGroupsWithState } from "@/actions/groups";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function EditLocalHostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; state_allocated?: string | null; tour_id?: string | null; tours?: { title: string }[] | null }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [manualState, setManualState] = useState("");
  const [district, setDistrict] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => {
    getAllGroupsWithState().then(setGroups).catch(() => setGroups([]));
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
    getLocalHost(id)
      .then(host => {
        setForm({
          name: host.name ?? "",
          phone: host.phone ?? "",
          email: host.email ?? "",
          address: host.address ?? "",
          notes: host.notes ?? "",
        });
        setGroupId(host.group_id ?? "");
        setTourId(host.group?.tour_id ?? "");
        setManualState(host.state ?? "");
        setDistrict(host.district ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const groupsForTour = tourId ? groups.filter(g => g.tour_id === tourId) : groups;
  const selectedGroup = groups.find(g => g.id === groupId);
  const groupState = selectedGroup?.state_allocated ?? "";
  const state = groupState || manualState;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateLocalHost(id, {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        state: state || undefined,
        district: district || undefined,
        address: form.address || undefined,
        group_id: groupId || undefined,
        notes: form.notes || undefined,
      });
      router.push("/admin/local-hosts");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update local host";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const districtStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
  };

  if (loading) return <div className="p-8" style={{ color: "var(--gs-muted)" }}>Loading...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Edit Local Host</h1>
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
              <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Name <span style={{ color: "var(--gs-danger)" }}>*</span></Label>
              <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Local host name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Phone</Label>
                <Input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit phone number" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="host@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Linked Tour (optional)</Label>
                <Select value={tourId || undefined} onValueChange={v => { setTourId(v ?? ""); setGroupId(""); }} items={tours.map(t => ({ value: t.id, label: t.title }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Linked Group (optional)</Label>
                <Select value={groupId || undefined} onValueChange={v => setGroupId(v ?? "")} items={groupsForTour.map(g => ({ value: g.id, label: g.name }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {groupsForTour.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>Selecting a tour filters the group list to that tour. State follows the linked group&apos;s allocated state below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>State/Union Territory</Label>
                {groupState ? (
                  <Input value={groupState} readOnly placeholder="From linked group" style={{ background: "#F0EEE6", color: "var(--gs-text-secondary)" }} />
                ) : (
                  <Select value={manualState || undefined} onValueChange={v => { setManualState(v ?? ""); setDistrict(""); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select State/Union Territory" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>District</Label>
                <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} style={districtStyle} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Address</Label>
              <Textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Enter address" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5" style={{ color: "var(--gs-text-secondary)" }}>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Enter notes" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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
