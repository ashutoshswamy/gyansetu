"use client";

import { useState } from "react";
import { approveTestResult, rejectTestResult } from "@/actions/tests";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ApproveRejectButtons({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      await approveTestResult(attemptId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      await rejectTestResult(attemptId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleApprove}
        disabled={loading !== null}
        className="bg-[#2A5E3A] text-white hover:bg-[#2A5E3A]/90"
      >
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button
        onClick={handleReject}
        disabled={loading !== null}
        variant="outline"
        className="border-[#B8381E]/30 text-[#B8381E] hover:bg-[#B8381E]/10"
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
