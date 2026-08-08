"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitMissedWorkshopSummary } from "@/actions/workshops";

export function MissedSummaryForm({ workshopId, isPast }: { workshopId: string; isPast: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!summary.trim()) {
      toast.error("Please enter a reason.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitMissedWorkshopSummary(workshopId, summary);
      setOpen(false);
      setSummary("");
      toast.success("Summary submitted successfully");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit summary";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="xs"
      >
        {isPast ? "I didn't attend" : "I will not attend"}
      </Button>
    );
  }

  return (
    <div className="mt-2.5 w-full">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Textarea
        value={summary}
        onChange={e => setSummary(e.target.value)}
        rows={3}
        placeholder={isPast ? "Explain why you missed this workshop (emergency reason)..." : "Let us know why you won't be able to attend..."}
      />
      <div className="flex items-center gap-3 mt-2">
        <Button
          onClick={handleSubmit}
          disabled={loading || !summary.trim()}
          size="sm"
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
        <Button
          onClick={() => { setOpen(false); setError(null); }}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
