"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveTourReport } from "@/actions/tour-reports";

export function ApproveReportButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await approveTourReport(id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4,
        background: loading ? "#C8C4BC" : "#2A5E3A", color: "white", border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "..." : "Approve"}
    </button>
  );
}
