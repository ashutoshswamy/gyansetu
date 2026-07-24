"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reportWorkshopAttended } from "@/actions/workshops";

export function AttendedButton({ workshopId }: { workshopId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await reportWorkshopAttended(workshopId);
      toast.success("Marked as attended — awaiting admin approval");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to report attendance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{ fontSize: 11, fontWeight: 600, minHeight: 40, padding: "0 14px", borderRadius: 4, background: "#2A5E3A", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "Submitting..." : "I attended"}
    </button>
  );
}
