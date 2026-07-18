"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRegistrationFee } from "@/actions/registration-fees";

export function MarkPaidButton({ feeId }: { feeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await updateRegistrationFee(feeId, { status: "paid", paid_at: new Date().toISOString() });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: loading ? "#C8C4BC" : "#2A5E3A",
        color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0,
      }}
    >
      {loading ? "..." : "Mark Paid"}
    </button>
  );
}
