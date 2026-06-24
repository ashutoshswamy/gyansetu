"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addImage } from "@/actions/gallery";
import { FileUploadField } from "@/components/features/file-upload-field";

interface Props {
  categoryId: string;
}

export default function AddImageForm({ categoryId }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await addImage(categoryId, url, caption, "admin");
      router.push("/admin/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "white",
      border: "1px solid #E4DFD1",
      borderRadius: 12,
      padding: 28,
    }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <FileUploadField
          label="Image URL *"
          value={url}
          onChange={setUrl}
          bucket="gallery-images"
          folder="gallery"
          accept="image/*"
          placeholder="https://example.com/photo.jpg or upload a file"
          hint="Paste a direct image URL or upload from your device (max 10 MB)"
          showImagePreview
        />

        <div>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#19140F",
            marginBottom: 6,
          }}>
            Caption
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for this image"
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              color: "#19140F",
              background: "#FAFAF7",
              border: "1.5px solid #E4DFD1",
              borderRadius: 6,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{
            fontSize: 13,
            color: "#C0392B",
            background: "rgba(192,57,43,0.07)",
            border: "1px solid rgba(192,57,43,0.18)",
            borderRadius: 6,
            padding: "8px 12px",
            margin: 0,
          }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: "transparent",
              color: "#5A5247",
              fontSize: 13,
              fontWeight: 500,
              padding: "8px 18px",
              borderRadius: 6,
              border: "1.5px solid #E4DFD1",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              background: loading || !url.trim() ? "#A0A7DC" : "#4A55BE",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              cursor: loading || !url.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Adding..." : "Add Image"}
          </button>
        </div>
      </form>
    </div>
  );
}
