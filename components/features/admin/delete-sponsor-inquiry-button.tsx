"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSponsorInquiry } from "@/actions/public-forms";
import { Button } from "@/components/ui/button";

export function DeleteSponsorInquiryButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSponsorInquiry(id);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete inquiry");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1 flex-shrink-0">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={deleting}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="destructive" className="flex-shrink-0" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
