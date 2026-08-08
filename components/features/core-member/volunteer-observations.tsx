"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createVolunteerObservation } from "@/actions/core-member";
import type { VolunteerObservation } from "@/types";

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
      <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: 11, color: "var(--gs-muted)" }}>
        <Lock size={11} /> Private — visible only to admins and core members
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap mb-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an observation about this volunteer..."
          rows={2}
          style={{ flex: 1, minWidth: 220, fontSize: 13, padding: "9px 12px", borderRadius: 6, border: "1px solid var(--border)", color: "var(--foreground)", resize: "vertical" }}
        />
        <button
          type="submit"
          disabled={loading || !note.trim()}
          style={{
            fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", alignSelf: "flex-start",
            background: loading || !note.trim() ? "#C8C4BC" : "var(--gs-accent)", color: "white", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>
      {error && <p style={{ fontSize: 12, color: "var(--gs-danger)", marginBottom: 8 }}>{error}</p>}

      {observations.length === 0 ? (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, textAlign: "center", padding: "20px" }}>
          <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No observations yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {observations.map((o) => (
            <div key={o.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 13, color: "var(--foreground)", margin: "0 0 6px", whiteSpace: "pre-wrap" }}>{o.note}</p>
              <p style={{ fontSize: 11, color: "var(--gs-muted)", margin: 0 }}>
                {o.author?.name ?? "Unknown"} · {new Date(o.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
