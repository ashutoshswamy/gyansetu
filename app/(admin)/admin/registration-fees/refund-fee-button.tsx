"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { refundRegistrationFee } from "@/actions/registration-fees";
import { Button } from "@/components/ui/button";

export function RefundFeeButton({ feeId }: { feeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const reason = prompt("Reason for refunding this fee (optional):") ?? "";
    setLoading(true);
    try {
      const result = await refundRegistrationFee(feeId, reason);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Fee refunded");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to refund fee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline" size="sm" className="flex-shrink-0">
      {loading ? "..." : "Refund"}
    </Button>
  );
}
