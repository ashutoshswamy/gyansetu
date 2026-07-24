"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLocalHost } from "@/actions/local-hosts";
import { createClientClient } from "@/lib/supabase/client";

export default function NewLocalHostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string; tours?: { title: string }[] | null }[]>([]);

  useEffect(() => {
    createClientClient()
      .from("tour_groups")
      .select("id, name, tours(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGroups(data ?? []));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F", boxSizing: "border-box",
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
        state: (fd.get("state") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        group_id: (fd.get("group_id") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      router.push("/admin/local-hosts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create local host");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Add Local Host</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 28 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Name <span style={{ color: "#DC2626" }}>*</span></label>
              <input name="name" required style={inputStyle} placeholder="Local host name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Phone</label>
                <input name="phone" style={inputStyle} placeholder="+91..." />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Email</label>
                <input name="email" type="email" style={inputStyle} placeholder="host@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>State</label>
                <input name="state" placeholder="Enter state" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>City</label>
                <input name="city" placeholder="Enter city" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Address</label>
              <textarea name="address" rows={2} placeholder="Enter address" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Linked Group (optional)</label>
              <select name="group_id" style={inputStyle}>
                <option value="">None</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}{g.tours?.[0]?.title ? ` — ${g.tours[0].title}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Enter notes" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={loading} style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Add Local Host"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", color: "#5A5247", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 6, border: "1.5px solid #E4DFD1", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
