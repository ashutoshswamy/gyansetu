"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTravelTicket } from "@/actions/travel";

export function ConfirmButton({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await updateTravelTicket(id, { confirmation_status: "confirmed" });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to confirm ticket");
    } finally {
      setLoading(false);
    }
  }

  if (disabled) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4,
        background: loading ? "#C8C4BC" : "#2A5E3A", color: "white", border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "..." : "Confirm"}
    </button>
  );
}

export function ApproveItineraryButton({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await updateTravelTicket(id, { itinerary_approved: !approved });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update itinerary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4,
        background: "transparent", color: approved ? "#2A5E3A" : "#5A5247",
        border: `1.5px solid ${approved ? "rgba(42,94,58,0.3)" : "#E4DFD1"}`,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "..." : approved ? "Itinerary Approved" : "Approve Itinerary"}
    </button>
  );
}
