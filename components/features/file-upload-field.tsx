"use client";

import { useRef, useState } from "react";
import { uploadFileToStorage } from "@/actions/upload";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  folder: string;
  accept?: string;
  placeholder?: string;
  hint?: string;
  /** Show image preview when URL is valid */
  showImagePreview?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 14,
  color: "#19140F",
  background: "white",
  border: "1px solid #E4DFD1",
  borderRadius: 7,
  padding: "9px 12px",
  outline: "none",
  boxSizing: "border-box",
};

export function FileUploadField({
  label,
  value,
  onChange,
  bucket,
  folder,
  accept = "image/*",
  placeholder = "https://...",
  hint,
  showImagePreview = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const url = await uploadFileToStorage(fd, bucket, folder);
      onChange(url);
      setPreviewError(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // reset so re-selecting same file triggers onChange
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#5A5247",
    marginBottom: 6,
    letterSpacing: "0.04em",
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>

      {/* URL input + upload button row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPreviewError(false); }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          style={{
            flexShrink: 0,
            background: uploading ? "#C8C4BC" : "#F3F0E8",
            color: uploading ? "#9B9188" : "#19140F",
            fontSize: 13,
            fontWeight: 600,
            padding: "9px 14px",
            borderRadius: 7,
            border: "1px solid #E4DFD1",
            cursor: uploading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
          onChange={handleFileChange}
        />
      </div>

      {/* Hint */}
      {hint && !uploadError && (
        <p style={{ fontSize: 11, color: "#9B9188", marginTop: 5 }}>{hint}</p>
      )}

      {/* Upload error */}
      {uploadError && (
        <p style={{ fontSize: 12, color: "#C0392B", marginTop: 5 }}>{uploadError}</p>
      )}

      {/* Image preview */}
      {showImagePreview && value.trim() && !previewError && (
        <div style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #E4DFD1",
          maxHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3F0E8",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-typed URL, not a whitelisted host for next/image */}
          <img
            src={value}
            alt="Preview"
            onError={() => setPreviewError(true)}
            style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", display: "block" }}
          />
        </div>
      )}
      {showImagePreview && previewError && value.trim() && (
        <p style={{ fontSize: 12, color: "#F5A520", marginTop: 5 }}>
          Could not load image preview. Make sure the URL points to a valid image.
        </p>
      )}
    </div>
  );
}
