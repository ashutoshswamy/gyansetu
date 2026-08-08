"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voidTestAttempt } from "@/actions/tests";
import { Button } from "@/components/ui/button";

export function VoidAttemptButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [voiding, setVoiding] = useState(false);

  async function handleVoid() {
    setVoiding(true);
    try {
      await voidTestAttempt(attemptId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to void attempt");
      setVoiding(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button onClick={handleVoid} disabled={voiding} variant="destructive" size="sm">
          {voiding ? "Voiding..." : "Confirm"}
        </Button>
        <Button onClick={() => setConfirming(false)} disabled={voiding} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setConfirming(true)}
      title="Deletes this attempt so the student can retake the test"
      variant="outline"
    >
      Void (allow retake)
    </Button>
  );
}
