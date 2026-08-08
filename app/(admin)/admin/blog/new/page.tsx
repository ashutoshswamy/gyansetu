"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPost } from "@/actions/blog";
import { FileUploadField } from "@/components/features/file-upload-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    status: "draft" as "draft" | "published",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug === "" || prev.slug === autoSlug(prev.title) ? autoSlug(title) : prev.slug,
    }));
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { fail("Title is required."); return; }
    if (!form.slug.trim()) { fail("Slug is required."); return; }
    if (!form.content.trim()) { fail("Content is required."); return; }

    setLoading(true);
    try {
      await createPost({
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim(),
        cover_image_url: form.cover_image_url.trim() || undefined,
        status: form.status,
      });
      router.push("/admin/blog");
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FBF7EC", padding: "32px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>New Blog Post</h1>
          <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>Write and publish a new blog post.</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "white",
            border: "1px solid #E4DFD1",
            borderRadius: 12,
            padding: "28px 28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Title */}
          <div>
            <Label htmlFor="title" className="mb-1.5">Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Our Journey to Rajasthan"
              value={form.title}
              onChange={handleTitleChange}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug" className="mb-1.5">Slug *</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              placeholder="e.g. our-journey-to-rajasthan"
              value={form.slug}
              onChange={handleChange}
              required
            />
            <p style={{ fontSize: 11, color: "#9B9188", marginTop: 5 }}>
              URL: /blog/{form.slug || "..."}
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <Label htmlFor="excerpt" className="mb-1.5">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              placeholder="A short summary shown on the blog listing..."
              value={form.excerpt}
              onChange={handleChange}
              rows={2}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="mb-1.5">Content *</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write the full blog post content here..."
              value={form.content}
              onChange={handleChange}
              rows={14}
              required
            />
          </div>

          {/* Cover image */}
          <FileUploadField
            label="Cover Image"
            value={form.cover_image_url}
            onChange={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))}
            bucket="blog-covers"
            folder="covers"
            accept="image/*"
            placeholder="https://... or upload a file"
            hint="Paste a URL or upload an image (max 10 MB)"
            showImagePreview
          />

          {/* Status */}
          <div>
            <Label htmlFor="status" className="mb-1.5">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((prev) => ({ ...prev, status: (v as "draft" | "published") ?? "draft" }))}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 6, padding: "10px 14px" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
