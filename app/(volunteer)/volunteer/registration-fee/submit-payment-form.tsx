"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitRegistrationFee } from "@/actions/registration-fees";

export function RecordFeeForm({
  tour,
  group,
  presetAmount,
}: {
  tour: { title: string } | null;
  group: { name: string } | null;
  presetAmount?: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(presetAmount ? String(presetAmount) : "");
  const [txnId, setTxnId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitRegistrationFee({
        amount: Number(amount),
        payment_reference: txnId.trim(),
        notes: notes.trim() || undefined,
      });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: "var(--gs-text-secondary)" }}>
        <span><span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Tour: </span>{tour?.title ?? "Not assigned to a tour yet"}</span>
        <span><span style={{ fontWeight: 600, color: "var(--gs-muted)" }}>Group: </span>{group?.name ?? "Not assigned to a group yet"}</span>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Amount paid (₹)</label>
        <Input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          readOnly={presetAmount !== undefined}
          disabled={presetAmount !== undefined}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Transaction ID</label>
        <Input
          type="text"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          placeholder="e.g. UPI transaction ID"
          required
          minLength={3}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Remarks (optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the admin should know about this payment"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Record Payment"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Admin will verify this and mark your payment as approved.</p>
    </form>
  );
}
