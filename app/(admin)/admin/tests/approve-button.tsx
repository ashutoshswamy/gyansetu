"use client";

import { useState } from "react";
import { approveTestResult, rejectTestResult } from "@/actions/tests";
import { useRouter } from "next/navigation";

export function ApproveRejectButtons({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      await approveTestResult(attemptId);
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Failed to approve");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      await rejectTestResult(attemptId);
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Failed to reject");
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
          fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4,
          background: loading === "approve" ? "#C8C4BC" : "#2A5E3A",
          color: "white", border: "none", cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "approve" ? "..." : "Approve"}
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        style={{
          fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4,
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
