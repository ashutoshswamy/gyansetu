"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestWithdrawal } from "@/actions/tours";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const MIN_WORDS = 5;
const MAX_WORDS = 100;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const words = wordCount(reason);
  const valid = words >= MIN_WORDS && words <= MAX_WORDS;

  async function handleSubmit() {
    setLoading(true);
    try {
      await requestWithdrawal(applicationId, reason);
      toast.success("Withdrawal request submitted. Waiting on admin approval.");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Withdraw from Tour
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw from Tour</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>
            Tell us why you&apos;re withdrawing. An admin needs to approve this before you&apos;re actually withdrawn.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Reason for withdrawing (${MIN_WORDS}-${MAX_WORDS} words)`}
            rows={5}
          />
          <p style={{ fontSize: 12, color: valid || words === 0 ? "var(--gs-muted)" : "var(--gs-danger-alt)" }}>
            {words} / {MAX_WORDS} words {words > 0 && !valid ? `(minimum ${MIN_WORDS})` : ""}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !valid} variant="destructive">
            {loading ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
