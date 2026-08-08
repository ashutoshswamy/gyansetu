"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLocalHost, updateLocalHost } from "@/actions/local-hosts";
import { createClientClient } from "@/lib/supabase/client";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";

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
    createClientClient()
      .from("tour_groups")
      .select("id, name, state_allocated, tour_id, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups(data ?? []));
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

  const inputStyle: React.CSSProperties = {
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
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--gs-danger)" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Name <span style={{ color: "var(--gs-danger)" }}>*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Local host name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Phone</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} style={inputStyle} placeholder="10-digit phone number" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="host@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Linked Tour (optional)</label>
                <select value={tourId} onChange={e => { setTourId(e.target.value); setGroupId(""); }} style={inputStyle}>
                  <option value="">None</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Linked Group (optional)</label>
                <select value={groupId} onChange={e => setGroupId(e.target.value)} style={inputStyle}>
                  <option value="">None</option>
                  {groupsForTour.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: "-10px 0 0" }}>Selecting a tour filters the group list to that tour. State follows the linked group&apos;s allocated state below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>State/Union Territory</label>
                {groupState ? (
                  <input value={groupState} readOnly placeholder="From linked group" style={{ ...inputStyle, background: "#F0EEE6", color: "var(--gs-text-secondary)" }} />
                ) : (
                  <select value={manualState} onChange={e => { setManualState(e.target.value); setDistrict(""); }} style={inputStyle}>
                    <option value="">Select State/Union Territory</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>District</label>
                <DistrictSelect key={state} state={state} value={district} onChange={setDistrict} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Address</label>
              <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Enter address" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Enter notes" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving} style={{ background: "var(--gs-accent)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", color: "var(--gs-text-secondary)", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid var(--border)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
