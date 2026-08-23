"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleExport}
      disabled={loading}
      style={{ background: "var(--gs-success)" }}
      className="text-white"
    >
      <Download size={14} />
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
