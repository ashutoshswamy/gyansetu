"use client";

import { useState } from "react";
import { toast } from "sonner";
import { applyForTour } from "@/actions/tours";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ApplyButton({ tourId }: { tourId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setLoading(true);
    setError(null);
    try {
      await applyForTour(tourId);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Application failed";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg px-4 py-3" style={{ background: "rgba(var(--gs-danger-alt-rgb), 0.07)", border: "1px solid rgba(var(--gs-danger-alt-rgb), 0.2)", fontSize: 13, color: "var(--gs-danger-alt)" }}>
          {error}
        </div>
      )}
      <Button onClick={handleApply} disabled={loading} className="w-full">
        {loading ? "Applying..." : "Apply for this Tour"}
      </Button>
    </div>
  );
}
