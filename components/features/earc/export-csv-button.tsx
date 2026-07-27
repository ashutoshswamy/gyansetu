"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportCsvButton({ exportAction, filename }: { exportAction: () => Promise<string>; filename: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await exportAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5"
      style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#2A5E3A", padding: "8px 16px", borderRadius: 6, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
    >
      <Download size={14} />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}
