"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/actions/gallery";

export default function NewGalleryCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await createCategory(name, description);
      router.push("/admin/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "48px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#9B9188",
            marginBottom: 4,
          }}>
            Admin Console / Gallery
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>
            New Category
          </h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Create a new gallery category to group related images.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: "white",
          border: "1px solid #E4DFD1",
          borderRadius: 12,
          padding: 28,
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#19140F",
                marginBottom: 6,
              }}>
                Category Name <span style={{ color: "#C0392B" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajasthan 2024"
                required
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

            <div>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#19140F",
                marginBottom: 6,
              }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this category (optional)"
                rows={3}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 14,
                  color: "#19140F",
                  background: "#FAFAF7",
                  border: "1.5px solid #E4DFD1",
                  borderRadius: 6,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
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
                disabled={loading || !name.trim()}
                style={{
                  background: loading || !name.trim() ? "#A0A7DC" : "#4A55BE",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "none",
                  cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
