"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setWorkshopAttendance, decideMakeup } from "@/actions/workshops";

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
      <button
        onClick={() => mark("present")}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: loading === "present" ? "#C8C4BC" : "#2A5E3A",
          color: "white", border: "none", cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "present" ? "..." : pendingApproval ? "Approve" : "Present"}
      </button>
      <button
        onClick={() => mark("absent")}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent", color: "#B8381E",
          border: "1.5px solid rgba(184,56,30,0.3)",
          cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "absent" ? "..." : pendingApproval ? "Reject" : "Absent"}
      </button>
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
      <button
        onClick={() => decide("allowed")}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: loading === "allowed" ? "#C8C4BC" : "#2A5E3A",
          color: "white", border: "none", cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "allowed" ? "..." : "Allow Makeup"}
      </button>
      <button
        onClick={() => decide("not_allowed")}
        disabled={loading !== null}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent", color: "#B8381E",
          border: "1.5px solid rgba(184,56,30,0.3)",
          cursor: loading !== null ? "not-allowed" : "pointer",
        }}
      >
        {loading === "not_allowed" ? "..." : "Deny Makeup"}
      </button>
    </div>
  );
}
