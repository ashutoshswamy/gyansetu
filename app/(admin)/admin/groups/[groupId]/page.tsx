"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { addGroupMember, removeGroupMember, setGroupCoreMember } from "@/actions/groups";
import { Users, MapPin, Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  group_leader: "Group Leader",
  project_member: "Project Member",
  group_core_member: "Core Member",
};

interface GroupMember {
  id: string;
  user_id: string;
  role_in_group?: string;
  users?: { name: string; email: string };
}

interface GroupDetail {
  name: string;
  state_allocated?: string;
  tours?: { id: string; title: string };
  tour_group_members?: GroupMember[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [volunteers, setVolunteers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`)
      .then(r => r.json())
      .then(d => { setGroup(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [groupId]);

  // Volunteers approved for this group's tour, plus enrollees (an admin can add an
  // enrollee directly and promote them to core member, ahead of tour selection).
  useEffect(() => {
    if (!group?.tours?.id) return;
    fetch(`/api/volunteers?tourId=${group.tours.id}&includeEnrollees=1`).then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, [group?.tours?.id]);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add member";
      setError(message);
      toast.error(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCoreMember(userId: string, roleInGroup?: string) {
    setSaving(true);
    setError(null);
    try {
      await setGroupCoreMember(groupId, userId, roleInGroup !== "group_core_member");
      const d = await fetch(`/api/groups/${groupId}`).then(r => r.json());
      setGroup(d);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update core member";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8" style={{ color: "var(--gs-muted)" }}>Loading...</div>;
  if (!group) return (
    <div className="p-8">
      <p style={{ color: "var(--gs-danger)", fontSize: 14 }}>Group not found.</p>
      <Button variant="link" onClick={() => router.back()} className="mt-3 px-0">← Back</Button>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/admin/groups")} className="mb-5 gap-1.5 px-0 hover:bg-transparent" style={{ color: "var(--gs-muted)" }}>
          <ArrowLeft size={14} /> Back to Groups
        </Button>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{group.name}</h1>
            {group.tours?.title && <p style={{ fontSize: 14, color: "var(--gs-muted)", marginTop: 4 }}>{group.tours.title}</p>}
          </div>
          {group.state_allocated && (
            <div style={{ background: "rgba(var(--gs-success-rgb), 0.08)", padding: "10px 16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--gs-success)" }}>
              <MapPin size={14} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{group.state_allocated}</span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "rgba(var(--gs-danger-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-rgb), 0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--gs-danger)" }}>
            {error}
          </div>
        )}

        {/* Add member */}
        <Card>
<CardContent>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 14px" }}>Add Member</h2>
          <div className="flex gap-3">
            <div style={{ flex: 2 }}>
              <VolunteerCombobox
                volunteers={volunteers}
                value={newUserId}
                onChange={setNewUserId}
                excludeIds={new Set((group.tour_group_members ?? []).map(m => m.user_id))}
              />
            </div>
            <Select value={newRole || undefined} onValueChange={v => setNewRole(v ?? "")}>
              <SelectTrigger className="flex-[2]">
                <SelectValue placeholder="Select role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="group_leader">Group Leader</SelectItem>
                <SelectItem value="project_member">Project Member</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMember}
              disabled={saving || !newUserId}
              className="flex-shrink-0 bg-[var(--gs-success)] text-white hover:bg-[var(--gs-success)]/90"
            >
              Add
            </Button>
          </div>
        </CardContent>
</Card>

        {/* Members list */}
        <Card>
<CardContent>
          <div className="flex items-center gap-2 mb-14">
            <Users size={16} style={{ color: "var(--gs-muted)" }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Members ({(group.tour_group_members ?? []).length})</h2>
          </div>
          {(group.tour_group_members ?? []).length === 0 ? (
            <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>No members yet.</p>
          ) : (
            <div className="space-y-2">
              {(group.tour_group_members ?? []).map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "var(--gs-card)" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{m.users?.name}</span>
                    <span style={{ fontSize: 12, color: "var(--gs-muted)", marginLeft: 8 }}>{m.users?.email}</span>
                    {m.role_in_group && <span style={{ fontSize: 12, color: "var(--gs-accent)", marginLeft: 8, padding: "1px 6px", background: "rgba(var(--gs-accent-rgb), 0.08)", borderRadius: 4 }}>{ROLE_LABELS[m.role_in_group] ?? m.role_in_group}</span>}
                  </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleCoreMember(m.user_id, m.role_in_group)}
                      disabled={saving}
                      className={`flex items-center gap-1.5 h-auto py-1 px-2 text-xs font-semibold ${m.role_in_group === "group_core_member" ? "text-destructive hover:text-destructive" : "text-emerald-600 hover:text-emerald-700"}`}
                    >
                      <ShieldCheck size={13} />
                      {m.role_in_group === "group_core_member" ? "Remove Core Member" : "Make Core Member"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
</Card>
      </div>
    </div>
  );
}
