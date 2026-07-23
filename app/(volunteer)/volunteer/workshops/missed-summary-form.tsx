"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitMissedWorkshopSummary } from "@/actions/workshops";

export function MissedSummaryForm({ workshopId }: { workshopId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!summary.trim()) return;
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
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4, background: "transparent", color: "#F5A520", border: "1.5px solid rgba(245,165,32,0.35)", cursor: "pointer" }}
      >
        I missed this — submit summary
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, width: "100%" }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}
      <textarea
        value={summary}
        onChange={e => setSummary(e.target.value)}
        rows={3}
        placeholder="Explain why you missed this workshop (emergency reason)..."
        style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1.5px solid #E4DFD1", borderRadius: 6, outline: "none", background: "#FAFAF7", color: "#19140F", boxSizing: "border-box", resize: "vertical" }}
      />
      <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !summary.trim()}
          style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 4, background: "#4A55BE", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          disabled={loading}
          style={{ fontSize: 11, fontWeight: 500, padding: "5px 14px", borderRadius: 4, background: "transparent", color: "#5A5247", border: "1.5px solid #E4DFD1", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
