"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroupsByTour, addGroupMember, removeGroupMember, updateGroup } from "@/actions/groups";
import { Users, MapPin, Star, Trash2, ArrowLeft } from "lucide-react";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  // We need to find which tour this group belongs to fetch all groups and find this one
  useEffect(() => {
    // Fallback: we'll just load from the page, can't call getGroupsByTour without tour_id
    // Instead use a direct API approach
    fetch(`/api/groups/${groupId}`)
      .then(r => r.json())
      .then(d => { setGroup(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [groupId]);

  async function handleAddMember() {
    if (!newUserId) return;
    setSaving(true);
    try {
      await addGroupMember(groupId, newUserId, newRole || undefined);
      setNewUserId("");
      setNewRole("");
      // Refresh
      const d = await fetch(`/api/groups/${groupId}`).then(r => r.json());
      setGroup(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    setSaving(true);
    try {
      await removeGroupMember(groupId, userId);
      const d = await fetch(`/api/groups/${groupId}`).then(r => r.json());
      setGroup(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none",
    background: "#FAFAF7", color: "#19140F",
  };

  if (loading) return <div className="p-8" style={{ color: "#9B9188" }}>Loading...</div>;
  if (!group) return (
    <div className="p-8">
      <p style={{ color: "#DC2626", fontSize: 14 }}>Group not found.</p>
      <button onClick={() => router.back()} style={{ marginTop: 12, fontSize: 13, color: "#4A55BE", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
    </div>
  );

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/admin/groups")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9B9188", background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Groups
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>{group.name}</h1>
            {group.tours?.title && <p style={{ fontSize: 14, color: "#9B9188", marginTop: 4 }}>{group.tours.title}</p>}
          </div>
          {group.state_allocated && (
            <div style={{ background: "rgba(42,94,58,0.08)", padding: "10px 16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, color: "#2A5E3A" }}>
              <MapPin size={14} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{group.state_allocated}</span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
            {error}
          </div>
        )}

        {/* Add member */}
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 14px" }}>Add Member</h2>
          <div className="flex gap-3">
            <select value={newUserId} onChange={e => setNewUserId(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
              <option value="">Select volunteer...</option>
              {volunteers
                .filter(v => !(group.tour_group_members ?? []).some((m: any) => m.user_id === v.id))
                .map(v => <option key={v.id} value={v.id}>{v.name} ({v.email})</option>)}
            </select>
            <input
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              placeholder="Role in group (optional)"
              style={{ ...inputStyle, flex: 2 }}
            />
            <button
              onClick={handleAddMember}
              disabled={saving || !newUserId}
              style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: saving || !newUserId ? "not-allowed" : "pointer", opacity: saving || !newUserId ? 0.6 : 1, flexShrink: 0 }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Members list */}
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20 }}>
          <div className="flex items-center gap-2 mb-14">
            <Users size={16} style={{ color: "#9B9188" }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>Members ({(group.tour_group_members ?? []).length})</h2>
          </div>
          {(group.tour_group_members ?? []).length === 0 ? (
            <p style={{ color: "#9B9188", fontSize: 14 }}>No members yet.</p>
          ) : (
            <div className="space-y-2">
              {(group.tour_group_members ?? []).map((m: any) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "#F3F0E8" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#19140F" }}>{m.users?.name}</span>
                    <span style={{ fontSize: 12, color: "#9B9188", marginLeft: 8 }}>{m.users?.email}</span>
                    {m.role_in_group && <span style={{ fontSize: 12, color: "#4A55BE", marginLeft: 8, padding: "1px 6px", background: "rgba(74,85,190,0.08)", borderRadius: 4 }}>{m.role_in_group}</span>}
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
