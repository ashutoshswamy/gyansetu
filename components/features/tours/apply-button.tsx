"use client";

import { useState } from "react";
import { applyForTour } from "@/actions/tours";
import { useRouter } from "next/navigation";

export function ApplyButton({ tourId }: { tourId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setLoading(true);
    setError(null);
    try {
      await applyForTour(tourId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Application failed");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg px-4 py-3" style={{ background: "rgba(184,56,30,0.07)", border: "1px solid rgba(184,56,30,0.2)", fontSize: 13, color: "#B8381E" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleApply}
        disabled={loading}
        style={{ width: "100%", background: loading ? "#C8C4BC" : "#4A55BE", color: "white", fontSize: 14, fontWeight: 600, padding: "12px 0", borderRadius: 7, border: "none", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Applying..." : "Apply for this Tour"}
      </button>
    </div>
  );
}
