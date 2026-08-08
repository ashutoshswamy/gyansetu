"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignVolunteerToTour, removeVolunteerFromTour } from "@/actions/tours";
import { VolunteerCombobox } from "@/components/features/volunteers/volunteer-combobox";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Volunteer = { id: string; name: string; email: string };
type Assignment = { id: string; role_description?: string; users?: { id: string; name: string; email: string } };

export function VolunteerAssign({ tourId, assignments }: { tourId: string; assignments: Assignment[] }) {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/volunteers").then(r => r.json()).then(d => setVolunteers(d.volunteers ?? []));
  }, []);

  async function handleAdd() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await assignVolunteerToTour(tourId, userId, role || undefined);
      setUserId("");
      setRole("");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign volunteer";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(volunteerId: string) {
    setSaving(true);
    try {
      await removeVolunteerFromTour(tourId, volunteerId);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 12 }}>
        Volunteers ({assignments.length})
      </p>

      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 mb-4">
        <div style={{ flex: 2 }}>
          <VolunteerCombobox
            volunteers={volunteers}
            value={userId}
            onChange={setUserId}
            excludeIds={new Set(assignments.map(a => a.users?.id).filter((id): id is string => !!id))}
          />
        </div>
        <Input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Role (optional)"
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={saving || !userId}
          className="flex-shrink-0 bg-[var(--gs-success)] text-white hover:bg-[var(--gs-success)]/90"
        >
          Add
        </Button>
      </div>

      {assignments.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No volunteers assigned yet.</p>
      ) : (
        <div className="space-y-1.5">
          {assignments.map(a => (
            <div key={a.id} className="flex items-center justify-between" style={{ background: "var(--gs-card)", borderRadius: 8, padding: "8px 12px" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{a.users?.name}</span>
                <span style={{ fontSize: 12, color: "var(--gs-muted)", marginLeft: 8 }}>{a.users?.email}</span>
                {a.role_description && <span style={{ fontSize: 12, color: "var(--gs-accent)", marginLeft: 8, padding: "1px 6px", background: "rgba(var(--gs-accent-rgb), 0.08)", borderRadius: 4 }}>{a.role_description}</span>}
              </div>
              <Button
                onClick={() => a.users?.id && handleRemove(a.users.id)}
                disabled={saving}
                variant="ghost"
                size="icon-sm"
                className="text-[var(--gs-danger)] hover:text-[var(--gs-danger)]"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
