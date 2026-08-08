"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTour, endTour, reactivateTour } from "@/actions/tours";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["draft", "open", "closed"] as const;

export function TourManageClient({ tourId, currentStatus }: { tourId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [choosingReactivate, setChoosingReactivate] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setLoading(true);
    try {
      await action();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
      setConfirmingEnd(false);
      setChoosingReactivate(false);
    }
  }

  if (currentStatus === "completed") {
    if (choosingReactivate) {
      return (
        <div className="flex items-center gap-2">
          <Button onClick={() => run(() => reactivateTour(tourId, "admin"))} disabled={loading} variant="outline" size="sm">
            Just for admin
          </Button>
          <Button
            onClick={() => run(() => reactivateTour(tourId, "all"))}
            disabled={loading}
            size="sm"
            className="bg-[var(--gs-success)] text-white hover:bg-[var(--gs-success)]/90"
          >
            For everyone
          </Button>
          <Button onClick={() => setChoosingReactivate(false)} disabled={loading} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      );
    }
    return (
      <Button onClick={() => setChoosingReactivate(true)} disabled={loading}>
        Reactivate
      </Button>
    );
  }

  if (confirmingEnd) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => run(() => endTour(tourId))} disabled={loading} variant="destructive" size="sm">
          {loading ? "Ending..." : "Confirm End Tour"}
        </Button>
        <Button onClick={() => setConfirmingEnd(false)} disabled={loading} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        disabled={loading}
        onValueChange={(value) => run(() => updateTour(tourId, { status: value as "draft" | "open" | "closed" }))}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => setConfirmingEnd(true)}
        disabled={loading}
        variant="outline"
        className="border-[var(--gs-danger-alt)]/30 text-[var(--gs-danger-alt)] hover:bg-[var(--gs-danger-alt)]/10"
      >
        End Tour
      </Button>
    </div>
  );
}
