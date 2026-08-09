"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createVolunteerObservation } from "@/actions/core-member";
import type { VolunteerObservation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function VolunteerObservations({
  volunteerId, groupId, observations,
}: {
  volunteerId: string;
  groupId?: string;
  observations: VolunteerObservation[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await createVolunteerObservation({ volunteer_id: volunteerId, group_id: groupId, note: note.trim() });
      setNote("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add observation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
        <Lock size={11} /> Private — visible only to admins and core members
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap mb-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an observation about this volunteer..."
          rows={2}
          className="flex-1 min-w-[220px]"
        />
        <Button
          type="submit"
          disabled={loading || !note.trim()}
          className="self-start text-xs font-semibold"
        >
          {loading ? "Adding..." : "Add"}
        </Button>
      </form>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {observations.length === 0 ? (
        <Card>
<CardContent>
          <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No observations yet.</p>
        </CardContent>
</Card>
      ) : (
        <div className="space-y-2">
          {observations.map((o) => (
            <Card key={o.id}>
<CardContent>
              <p style={{ fontSize: 13, color: "var(--foreground)", margin: "0 0 6px", whiteSpace: "pre-wrap" }}>{o.note}</p>
              <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: 0 }}>
                {o.author?.name ?? "Unknown"} · {new Date(o.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </CardContent>
</Card>
          ))}
        </div>
      )}
    </div>
  );
}
