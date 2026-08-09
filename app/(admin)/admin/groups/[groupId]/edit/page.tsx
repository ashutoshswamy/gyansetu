"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateGroup } from "@/actions/groups";
import { Card, CardContent } from "@/components/ui/card";

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({ tour_id: "", name: "", state_allocated: "", notes: "" });

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
    fetch(`/api/groups/${groupId}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          tour_id: d.tour_id ?? "",
          name: d.name ?? "",
          state_allocated: d.state_allocated ?? "",
          notes: d.notes ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateGroup(groupId, {
        tour_id: form.tour_id,
        name: form.name,
        state_allocated: form.state_allocated || undefined,
        notes: form.notes || undefined,
      });
      router.push("/admin/groups");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update group";
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Edit Group</h1>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Tour <span style={{ color: "var(--gs-danger)" }}>*</span></label>
              <select required value={form.tour_id} onChange={e => setForm(f => ({ ...f, tour_id: e.target.value }))} style={inputStyle}>
                <option value="">Select tour...</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>Group Name <span style={{ color: "var(--gs-danger)" }}>*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Team Rajasthan" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-text-secondary)", display: "block", marginBottom: 6 }}>State/Union Territory Allocated</label>
              <input value={form.state_allocated} onChange={e => setForm(f => ({ ...f, state_allocated: e.target.value }))} placeholder="e.g. Rajasthan" style={inputStyle} />
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
</CardContent>
</Card>
      </div>
    </div>
  );
}
