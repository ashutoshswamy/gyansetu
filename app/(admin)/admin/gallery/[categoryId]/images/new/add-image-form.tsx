"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addImage } from "@/actions/gallery";
import { FileUploadField } from "@/components/features/file-upload-field";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    if (!url.trim()) {
      toast.error("Image URL is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addImage(categoryId, url, caption);
      toast.success("Image added successfully");
      router.push("/admin/gallery");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <Card>
<CardContent>
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
          <Label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: 6,
          }}>
            Caption
          </Label>
          <Input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for this image"
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
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? "Adding..." : "Add Image"}
          </Button>
        </div>
      </form>
    </CardContent>
</Card>
  );
}
