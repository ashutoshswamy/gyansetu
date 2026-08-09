"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyRegistrationFee } from "@/actions/registration-fees";
import { Button } from "@/components/ui/button";

export function MarkPaidButton({ feeId, label = "Mark Paid" }: { feeId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await verifyRegistrationFee(feeId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      size="sm"
      className="flex-shrink-0"
      style={{ background: loading ? "#C8C4BC" : "var(--gs-success)", color: "white" }}
    >
      {loading ? "..." : label}
    </Button>
  );
}
