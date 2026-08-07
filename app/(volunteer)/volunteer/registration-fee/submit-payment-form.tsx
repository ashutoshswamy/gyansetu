"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <form onSubmit={handleSubmit} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #E4DFD1" }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
        Already paid? Enter your transaction ID
      </label>
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          placeholder="e.g. UPI transaction ID"
          required
          minLength={3}
          style={{ flex: 1, minWidth: 200, fontSize: 13, padding: "9px 12px", borderRadius: 6, border: "1px solid #E4DFD1", color: "#19140F" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none",
            background: loading ? "#C8C4BC" : "#4A55BE", color: "white", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>{error}</p>}
      <p style={{ fontSize: 11, color: "#9B9188", marginTop: 6 }}>Admin will verify this and mark your payment as confirmed.</p>
    </form>
  );
}
