"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveWithdrawal, rejectWithdrawal } from "@/actions/tours";
import { Button } from "@/components/ui/button";

export function WithdrawalActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    try {
      await (action === "approve" ? approveWithdrawal(applicationId) : rejectWithdrawal(applicationId));
      toast.success(action === "approve" ? "Withdrawal approved" : "Withdrawal declined");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process withdrawal");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handle("approve")}
        disabled={loading !== null}
        size="sm"
        className="bg-[var(--gs-success)] text-white hover:bg-[var(--gs-success)]/90"
      >
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button
        onClick={() => handle("reject")}
        disabled={loading !== null}
        size="sm"
        variant="outline"
        className="border-[var(--gs-danger-alt)]/30 text-[var(--gs-danger-alt)] hover:bg-[var(--gs-danger-alt)]/10"
      >
        {loading === "reject" ? "..." : "Decline"}
      </Button>
    </div>
  );
}
