"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reportWorkshopAttended } from "@/actions/workshops";

export function AttendedButton({ workshopId, isPast }: { workshopId: string; isPast: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await reportWorkshopAttended(workshopId);
      toast.success(isPast ? "Marked as attended — awaiting admin approval" : "RSVP recorded — see you there!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to report attendance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      size="xs"
    >
      {loading ? "Submitting..." : isPast ? "I attended" : "I will attend"}
    </Button>
  );
}
