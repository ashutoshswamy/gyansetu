"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/actions/blog";
import { FileUploadField } from "@/components/features/file-upload-field";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#5A5247",
  marginBottom: 6,
  letterSpacing: "0.04em",
};

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    if (!form.content.trim()) { setError("Content is required."); return; }

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
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
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
            <label style={labelStyle} htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Our Journey to Rajasthan"
              value={form.title}
              onChange={handleTitleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle} htmlFor="slug">Slug *</label>
            <input
              id="slug"
              name="slug"
              type="text"
              placeholder="e.g. our-journey-to-rajasthan"
              value={form.slug}
              onChange={handleChange}
              style={inputStyle}
              required
            />
            <p style={{ fontSize: 11, color: "#9B9188", marginTop: 5 }}>
              URL: /blog/{form.slug || "..."}
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelStyle} htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              placeholder="A short summary shown on the blog listing..."
              value={form.excerpt}
              onChange={handleChange}
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle} htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              placeholder="Write the full blog post content here..."
              value={form.content}
              onChange={handleChange}
              rows={14}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
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
            <label style={labelStyle} htmlFor="status">Status</label>
            <div style={{ position: "relative" }}>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <path d="M4 6l4 4 4-4" stroke="#9B9188" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 6, padding: "10px 14px" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => router.push("/admin/blog")}
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
              disabled={loading}
              style={{
                background: loading ? "#9B9188" : "#4A55BE",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 22px",
                borderRadius: 6,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Saving..." : "Save Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
