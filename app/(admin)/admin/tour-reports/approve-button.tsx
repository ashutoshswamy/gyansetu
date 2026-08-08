"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveTourReport } from "@/actions/tour-reports";
import { Button } from "@/components/ui/button";

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
    <Button onClick={handleClick} disabled={loading} className="bg-[var(--gs-success)] text-white hover:bg-[var(--gs-success)]/90">
      {loading ? "..." : "Approve"}
    </Button>
  );
}
