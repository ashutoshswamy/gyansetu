"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voidTestAttempt } from "@/actions/tests";

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
        <button
          onClick={handleVoid}
          disabled={voiding}
          style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 5, border: "none", background: "#B8381E", color: "white", cursor: voiding ? "not-allowed" : "pointer", opacity: voiding ? 0.7 : 1 }}
        >
          {voiding ? "Voiding..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={voiding}
          style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Deletes this attempt so the student can retake the test"
      style={{ fontSize: 12, fontWeight: 500, padding: "9px 14px", minHeight: 38, borderRadius: 6, background: "transparent", color: "#5A5247", border: "1.5px solid #E4DFD1", cursor: "pointer" }}
    >
      Void (allow retake)
    </button>
  );
}
