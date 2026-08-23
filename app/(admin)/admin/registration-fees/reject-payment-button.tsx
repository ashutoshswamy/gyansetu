"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rejectRegistrationFee } from "@/actions/registration-fees";
import { Button } from "@/components/ui/button";

export function RejectPaymentButton({ feeId }: { feeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const reason = prompt("Reason for rejecting this payment:");
    if (!reason) return;
    setLoading(true);
    try {
      const result = await rejectRegistrationFee(feeId, reason);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Payment rejected");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="destructive" size="sm" className="flex-shrink-0">
      {loading ? "..." : "Reject"}
    </Button>
  );
}
