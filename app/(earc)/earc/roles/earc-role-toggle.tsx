"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setEarcStaffRole } from "@/actions/users";

export function EarcRoleToggle({ clerkId, isEarcStaff }: { clerkId: string; isEarcStaff: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      await setEarcStaffRole(clerkId, !isEarcStaff);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update role";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          fontSize: 12,
          fontWeight: 600,
          padding: "8px 10px",
          borderRadius: 6,
          border: isEarcStaff ? "1.5px solid #E4B8AE" : "1.5px solid #E4DFD1",
          color: isEarcStaff ? "#B8381E" : "#19140F",
          background: "white",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Updating…" : isEarcStaff ? "Remove EARC Staff" : "Make EARC Staff"}
      </button>
      {error && <span style={{ fontSize: 12, fontWeight: 600, color: "#B8381E" }}>{error}</span>}
    </div>
  );
}
