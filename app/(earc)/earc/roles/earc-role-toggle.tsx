"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
      <Button
        onClick={handleToggle}
        disabled={loading}
        variant={isEarcStaff ? "destructive" : "outline"}
        size="sm"
      >
        {loading ? "Updating…" : isEarcStaff ? "Remove EARC Staff" : "Make EARC Staff"}
      </Button>
      {error && <span className="text-xs font-semibold text-destructive">{error}</span>}
    </div>
  );
}
