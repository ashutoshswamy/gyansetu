"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAadhaarVerified } from "@/actions/profiles";
import { Button } from "@/components/ui/button";

export function AadhaarToggleButton({ userId, verified, docUploaded = true }: { userId: string; verified: boolean; docUploaded?: boolean }) {
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
          color: verified ? "var(--gs-success)" : "var(--gs-warning-alt)",
          background: verified ? "rgba(var(--gs-success-rgb), 0.08)" : "rgba(var(--gs-warning-rgb), 0.1)",
        }}
      >
        {verified ? "Aadhaar Verified" : "Aadhaar Unverified"}
      </span>
      <Button
        onClick={handleClick}
        disabled={loading || (!verified && !docUploaded)}
        variant="outline"
        size="sm"
        style={{ color: "var(--gs-accent)" }}
        title={!verified && !docUploaded ? "Volunteer has not uploaded an Aadhaar document yet" : undefined}
      >
        {loading ? "..." : verified ? "Unverify" : "Verify"}
      </Button>
    </div>
  );
}
