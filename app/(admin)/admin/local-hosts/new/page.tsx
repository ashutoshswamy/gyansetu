"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLocalHost } from "@/actions/local-hosts";
import { createClientClient } from "@/lib/supabase/client";
import { INDIAN_STATES } from "@/lib/locations";
import { DistrictSelect } from "@/components/features/forms/district-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewLocalHostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; state_allocated?: string | null; tour_id?: string | null; tours?: { title: string }[] | null }[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [manualState, setManualState] = useState("");
  const [district, setDistrict] = useState("");

  useEffect(() => {
    createClientClient()
      .from("tour_groups")
      .select("id, name, state_allocated, tour_id, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups(data ?? []));
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, []);

  const groupsForTour = tourId ? groups.filter(g => g.tour_id === tourId) : groups;

  // Location follows the linked group (which carries its allocated state) — only fall back
  // to a manual pick when no group is linked, or that group has no state set yet.
  const selectedGroup = groups.find(g => g.id === groupId);
  const groupState = selectedGroup?.state_allocated ?? "";
  const state = groupState || manualState;

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setDistrict("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await createLocalHost({
        name: fd.get("name") as string,
        phone: (fd.get("phone") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        state: state || undefined,
        district: district || undefined,
        address: (fd.get("address") as string) || undefined,
        group_id: (fd.get("group_id") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      router.push("/admin/local-hosts");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create local host";
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Add Local Host</h1>
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
              <input name="name" required style={inputStyle} placeholder="Local host name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Phone</label>
                <input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} onInput={e => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} style={inputStyle} placeholder="10-digit phone number" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
                <input name="email" type="email" style={inputStyle} placeholder="host@example.com" />
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
                <select name="group_id" value={groupId} onChange={e => setGroupId(e.target.value)} style={inputStyle}>
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
                  <select value={manualState} onChange={e => setManualState(e.target.value)} style={inputStyle}>
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
              <textarea name="address" rows={2} placeholder="Enter address" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Enter notes" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "var(--gs-accent)", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Add Local Host"}
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
