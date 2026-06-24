"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

export function ExportButton({ data, filename, label = "Export CSV" }: ExportButtonProps) {
  function download() {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={!data.length}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: "oklch(1 0 0 / 5%)",
        border: "1px solid oklch(1 0 0 / 10%)",
        color: "oklch(0.65 0 0)",
      }}
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
