"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createNewsletter } from "@/actions/newsletter";
import { FileUploadField } from "@/components/features/file-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { fail("Title is required."); return; }

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
      fail(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>New Newsletter</h1>
          <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginTop: 4 }}>Publish a new newsletter issue.</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "white",
            border: "1px solid var(--border)",
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
              placeholder="e.g. Gyan Setu Winter Dispatch"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Issue number */}
          <div>
            <Label htmlFor="issue_number" className="mb-1.5">Issue Number</Label>
            <Input
              id="issue_number"
              name="issue_number"
              type="number"
              placeholder="e.g. 1"
              value={form.issue_number}
              onChange={handleChange}
              min={1}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="mb-1.5">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What's in this issue? A short summary..."
              value={form.description}
              onChange={handleChange}
              rows={4}
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
            <Label htmlFor="status" className="mb-1.5">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((prev) => ({ ...prev, status: (v ?? "draft") as "draft" | "published" }))}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
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
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/newsletter")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Newsletter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
