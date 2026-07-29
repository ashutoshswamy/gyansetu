"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTour, endTour, reactivateTour } from "@/actions/tours";

const STATUSES = ["draft", "open", "closed"] as const;

export function TourManageClient({ tourId, currentStatus }: { tourId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [choosingReactivate, setChoosingReactivate] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setLoading(true);
    try {
      await action();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
      setConfirmingEnd(false);
      setChoosingReactivate(false);
    }
  }

  if (currentStatus === "completed") {
    if (choosingReactivate) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => run(() => reactivateTour(tourId, "admin"))}
            disabled={loading}
            style={{ fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
          >
            Just for admin
          </button>
          <button
            onClick={() => run(() => reactivateTour(tourId, "all"))}
            disabled={loading}
            style={{ fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 5, border: "none", background: "#2A5E3A", color: "white", cursor: "pointer" }}
          >
            For everyone
          </button>
          <button
            onClick={() => setChoosingReactivate(false)}
            disabled={loading}
            style={{ fontSize: 12, padding: "7px 10px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setChoosingReactivate(true)}
        disabled={loading}
        style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 5, border: "none", background: "#4A55BE", color: "white", cursor: "pointer" }}
      >
        Reactivate
      </button>
    );
  }

  if (confirmingEnd) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => run(() => endTour(tourId))}
          disabled={loading}
          style={{ fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 5, border: "none", background: "#B8381E", color: "white", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Ending..." : "Confirm End Tour"}
        </button>
        <button
          onClick={() => setConfirmingEnd(false)}
          disabled={loading}
          style={{ fontSize: 12, padding: "7px 10px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(e) => run(() => updateTour(tourId, { status: e.target.value as "draft" | "open" | "closed" }))}
        style={{ fontSize: 13, padding: "7px 12px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#19140F", cursor: "pointer" }}
      >
        {STATUSES.map(s => (
          <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        onClick={() => setConfirmingEnd(true)}
        disabled={loading}
        style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 5, border: "1.5px solid rgba(184,56,30,0.28)", background: "white", color: "#B8381E", cursor: "pointer" }}
      >
        End Tour
      </button>
    </div>
  );
}
