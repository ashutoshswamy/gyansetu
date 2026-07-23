"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadEarcFile, type EarcFileCategory } from "@/actions/earc";
import { Upload, Loader2 } from "lucide-react";

export function EarcUploadForm({
  category,
  accentColor,
}: {
  category: EarcFileCategory;
  accentColor: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"upload" | "link">("upload");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await uploadEarcFile(fd, category);
        setSuccess(true);
        toast.success("File uploaded successfully");
        formRef.current?.reset();
        setTimeout(() => {
          setSuccess(false);
          window.location.reload();
        }, 1200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mb-6"
      style={{ background: "white", border: "1px solid #E4DFD1" }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", marginBottom: 16 }}>Upload File</h2>

      <div className="space-y-4">
        <div>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "upload" ? "#4A55BE" : "#5A5247", fontWeight: 600 }}>
              <input type="radio" checked={mode === "upload"} onChange={() => setMode("upload")} style={{ accentColor: "#4A55BE" }} />
              Upload File
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "link" ? "#4A55BE" : "#5A5247", fontWeight: 600 }}>
              <input type="radio" checked={mode === "link"} onChange={() => setMode("link")} style={{ accentColor: "#4A55BE" }} />
              Direct Link
            </label>
          </div>

          {mode === "upload" ? (
            <div>
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp"
                className="block w-full text-sm"
                style={{ color: "#19140F" }}
              />
              <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>
                PDF, Word, Excel, CSV, or image — max 20 MB
              </p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                name="file_url"
                required
                placeholder="https://example.com/document.pdf"
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ border: "1px solid #E4DFD1", color: "#19140F", background: "#FAFAF7" }}
              />
              <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>
                Enter the direct web link (URL) of the file
              </p>
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
            Description
          </label>
          <input
            type="text"
            name="description"
            placeholder="Optional note about this file"
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ border: "1px solid #E4DFD1", color: "#19140F", background: "#FAFAF7" }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#B8381E", padding: "8px 12px", background: "rgba(184,56,30,0.06)", borderRadius: 6 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: 12, color: "#2A5E3A", padding: "8px 12px", background: "rgba(42,94,58,0.06)", borderRadius: 6 }}>
            File uploaded successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity"
          style={{ background: accentColor, color: "white", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
