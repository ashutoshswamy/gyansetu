"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTour } from "@/actions/tours";

const STATUSES = ["draft", "open", "closed", "completed"] as const;

export function TourManageClient({ tourId, currentStatus }: { tourId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await updateTour(tourId, { status: status as any });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(e) => changeStatus(e.target.value)}
        style={{ fontSize: 13, padding: "7px 12px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#19140F", cursor: "pointer" }}
      >
        {STATUSES.map(s => (
          <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}
