"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setWorkshopAttendance, decideMakeup } from "@/actions/workshops";
import { Button } from "@/components/ui/button";

export function MarkAttendanceButtons({ workshopId, volunteerId, pendingApproval }: { workshopId: string; volunteerId: string; pendingApproval?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"present" | "absent" | null>(null);

  async function mark(status: "present" | "absent") {
    setLoading(status);
    try {
      await setWorkshopAttendance({ workshop_id: workshopId, volunteer_id: volunteerId, attendance_status: status });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to set attendance");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => mark("present")}
        disabled={loading !== null}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
      >
        {loading === "present" ? "..." : pendingApproval ? "Approve" : "Present"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => mark("absent")}
        disabled={loading !== null}
        className="text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold"
      >
        {loading === "absent" ? "..." : pendingApproval ? "Reject" : "Absent"}
      </Button>
    </div>
  );
}

export function MakeupDecisionButtons({ workshopId, volunteerId }: { workshopId: string; volunteerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"allowed" | "not_allowed" | null>(null);

  async function decide(decision: "allowed" | "not_allowed") {
    setLoading(decision);
    try {
      await decideMakeup(workshopId, volunteerId, decision);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => decide("allowed")}
        disabled={loading !== null}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
      >
        {loading === "allowed" ? "..." : "Allow Makeup"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => decide("not_allowed")}
        disabled={loading !== null}
        className="text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold"
      >
        {loading === "not_allowed" ? "..." : "Deny Makeup"}
      </Button>
    </div>
  );
}
