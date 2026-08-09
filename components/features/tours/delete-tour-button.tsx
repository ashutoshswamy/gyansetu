"use client";

import { useState } from "react";
import { deleteTour } from "@/actions/tours";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteTourButton({ tourId }: { tourId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTour(tourId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete tour");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
