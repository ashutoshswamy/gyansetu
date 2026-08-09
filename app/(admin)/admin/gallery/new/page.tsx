"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategory } from "@/actions/gallery";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NewGalleryCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createCategory(name, description);
      router.push("/admin/gallery");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--gs-muted)",
            marginBottom: 4,
          }}>
            Admin Console / Gallery
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            New Category
          </h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Create a new gallery category to group related images.
          </p>
        </div>

        {/* Form card */}
        <Card>
<CardContent>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <Label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
              }}>
                Category Name <span style={{ color: "#C0392B" }}>*</span>
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajasthan 2024"
                required
              />
            </div>

            <div>
              <Label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
              }}>
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this category (optional)"
                rows={3}
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
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </CardContent>
</Card>
      </div>
    </div>
  );
}
