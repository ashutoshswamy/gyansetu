"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitPaymentReference } from "@/actions/registration-fees";

export function SubmitPaymentForm() {
  const router = useRouter();
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitPaymentReference({ payment_reference: txnId.trim() });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border">
      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
        Already paid? Enter your transaction ID
      </label>
      <div className="flex gap-2 flex-wrap">
        <Input
          type="text"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          placeholder="e.g. UPI transaction ID"
          required
          minLength={3}
          className="flex-1 min-w-52"
        />
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Payment"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1.5">Admin will verify this and mark your payment as confirmed.</p>
    </form>
  );
}
