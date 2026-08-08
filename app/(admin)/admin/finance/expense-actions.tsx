"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveExpense, rejectExpense, sendBackExpense } from "@/actions/finance";
import { Button } from "@/components/ui/button";

export function ExpenseActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "sendback" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      const result = await approveExpense(id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Expense approved");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    setLoading("reject");
    try {
      const result = await rejectExpense(id, reason);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Expense rejected");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoading(null);
    }
  }

  async function handleSendBack() {
    const reason = prompt("What needs to be fixed?");
    if (!reason) return;
    setLoading("sendback");
    try {
      const result = await sendBackExpense(id, reason);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Sent back to volunteer for revision");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send back");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading !== null}
        className="bg-[#2A5E3A] text-white hover:bg-[#2A5E3A]/85"
      >
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSendBack}
        disabled={loading !== null}
        className="border-[#F5A520]/35 text-[#F5A520] hover:bg-[#F5A520]/10"
      >
        {loading === "sendback" ? "..." : "Send Back"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleReject}
        disabled={loading !== null}
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
