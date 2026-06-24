"use client";

import { useState, useTransition } from "react";
import { deleteEarcFile } from "@/actions/earc";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";

interface EarcFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  description?: string | null;
  created_at: string;
  users?: { name: string } | { name: string }[] | null;
}

export function EarcFileList({
  files,
  accentColor,
}: {
  files: EarcFile[];
  accentColor: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteEarcFile(id);
        window.location.reload();
      } catch {
        alert("Delete failed.");
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid #E4DFD1" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #E4DFD1" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: 0 }}>
          Files ({files.length})
        </h2>
      </div>

      {files.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#E4DFD1" }} />
          <p style={{ fontSize: 14, color: "#9B9188" }}>No files uploaded yet.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "#E4DFD1" }}>
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}14` }}>
                <FileText className="w-4 h-4" style={{ color: accentColor }} />
              </div>

              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 13, fontWeight: 500, color: "#19140F" }} className="truncate">{f.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {f.description && (
                    <p style={{ fontSize: 12, color: "#9B9188" }} className="truncate">{f.description}</p>
                  )}
                  <span style={{ fontSize: 11, color: "#9B9188", flexShrink: 0 }}>
                    {(Array.isArray(f.users) ? f.users[0]?.name : f.users?.name) ?? "Unknown"} &middot; {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                  style={{ color: accentColor }}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={isPending && deletingId === f.id}
                  className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                  style={{ color: "#B8381E" }}
                  title="Delete"
                >
                  {isPending && deletingId === f.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
