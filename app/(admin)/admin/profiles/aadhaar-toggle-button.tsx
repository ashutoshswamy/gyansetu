"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAadhaarVerified } from "@/actions/profiles";

export function AadhaarToggleButton({ userId, verified }: { userId: string; verified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await setAadhaarVerified(userId, !verified);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update Aadhaar verification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
          padding: "2px 8px", borderRadius: 4,
          color: verified ? "#2A5E3A" : "#A8641C",
          background: verified ? "rgba(42,94,58,0.08)" : "rgba(245,165,32,0.1)",
        }}
      >
        {verified ? "Aadhaar Verified" : "Aadhaar Unverified"}
      </span>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 12px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent",
          color: "#4A55BE",
          border: "1.5px solid rgba(74,85,190,0.3)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "..." : verified ? "Unverify" : "Verify"}
      </button>
    </div>
  );
}
