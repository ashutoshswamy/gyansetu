"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewsletter } from "@/actions/newsletter";
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

export default function NewNewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    issue_number: "",
    file_url: "",
    status: "draft" as "draft" | "published",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required."); return; }

    setLoading(true);
    try {
      await createNewsletter({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        file_url: form.file_url.trim() || undefined,
        issue_number: form.issue_number ? parseInt(form.issue_number, 10) : undefined,
        status: form.status,
      });
      router.push("/admin/newsletter");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>New Newsletter</h1>
          <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>Publish a new newsletter issue.</p>
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
              placeholder="e.g. Gyan Setu Winter Dispatch"
              value={form.title}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Issue number */}
          <div>
            <label style={labelStyle} htmlFor="issue_number">Issue Number</label>
            <input
              id="issue_number"
              name="issue_number"
              type="number"
              placeholder="e.g. 1"
              value={form.issue_number}
              onChange={handleChange}
              min={1}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle} htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="What's in this issue? A short summary..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* File URL */}
          <FileUploadField
            label="File (PDF / Doc)"
            value={form.file_url}
            onChange={(url) => setForm((prev) => ({ ...prev, file_url: url }))}
            bucket="newsletter-files"
            folder="issues"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            placeholder="https://... or upload a file"
            hint="Paste a URL or upload a PDF/Doc (max 10 MB). Readers will download or view this file."
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
              onClick={() => router.push("/admin/newsletter")}
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
              {loading ? "Saving..." : "Save Newsletter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
