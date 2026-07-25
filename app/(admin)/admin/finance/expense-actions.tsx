"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveExpense, rejectExpense, sendBackExpense } from "@/actions/finance";

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
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: loading === "approve" ? "#C8C4BC" : "#2A5E3A",
          color: "white", border: "none", cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "approve" ? "..." : "Approve"}
      </button>
      <button
        onClick={handleSendBack}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent", color: "#F5A520",
          border: "1.5px solid rgba(245,165,32,0.35)",
          cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "sendback" ? "..." : "Send Back"}
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent", color: "#B8381E",
          border: "1.5px solid rgba(184,56,30,0.3)",
          cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "reject" ? "..." : "Reject"}
      </button>
    </div>
  );
}
