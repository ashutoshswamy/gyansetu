"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTravelTicket } from "@/actions/travel";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleClick}
      disabled={loading}
      size="sm"
      className="bg-[#2A5E3A] text-white hover:bg-[#234a2f]"
    >
      {loading ? "..." : "Confirm"}
    </Button>
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
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      size="sm"
      className={approved ? "border-[rgba(42,94,58,0.3)] text-[#2A5E3A]" : ""}
    >
      {loading ? "..." : approved ? "Itinerary Approved" : "Approve Itinerary"}
    </Button>
  );
}
