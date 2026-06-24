"use client";

import { useState, useEffect, useRef } from "react";
import { uploadMedia, getMediaByTour } from "@/actions/daily-logs";
import { Image as ImageIcon, Upload, X } from "lucide-react";

export default function VolunteerMediaPage() {
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [selectedTour, setSelectedTour] = useState("");
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => {
      const t = Array.isArray(d) ? d : [];
      setTours(t);
      if (t.length > 0) setSelectedTour(t[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTour) return;
    setLoading(true);
    getMediaByTour(selectedTour).then(d => { setMedia(d); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedTour]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedTour) return;
    setUploading(true);
    setError(null);
    try {
      // Upload to Supabase Storage
      const { createClientClient } = await import("@/lib/supabase/client");
      const sb = createClientClient();
      const path = `media/${selectedTour}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await sb.storage.from("media").upload(path, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data: urlData } = sb.storage.from("media").getPublicUrl(path);
      const item = await uploadMedia(selectedTour, urlData.publicUrl, caption || undefined, file.type.startsWith("video/") ? "video" : "photo");
      setMedia(prev => [item, ...prev]);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Media Gallery</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Upload photos and documents from your visit</p>
        </div>

        {/* Tour selector + upload */}
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedTour}
              onChange={e => setSelectedTour(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", fontSize: 14, border: "1.5px solid #E4DFD1", borderRadius: 6, background: "#FAFAF7", color: "#19140F" }}
            >
              {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <form onSubmit={handleUpload} className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                required
                style={{ width: "100%", padding: "7px 12px", fontSize: 13, border: "1.5px solid #E4DFD1", borderRadius: 6, background: "#FAFAF7", color: "#19140F" }}
              />
            </div>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              style={{ flex: 1, padding: "8px 12px", fontSize: 14, border: "1.5px solid #E4DFD1", borderRadius: 6, background: "#FAFAF7", color: "#19140F" }}
            />
            <button
              type="submit"
              disabled={uploading || !selectedTour}
              style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: uploading ? 0.7 : 1 }}
            >
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
          {error && <p style={{ fontSize: 13, color: "#DC2626", marginTop: 8 }}>{error}</p>}
        </div>

        {loading ? (
          <p style={{ color: "#9B9188", fontSize: 14 }}>Loading...</p>
        ) : media.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <ImageIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No media for this tour yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>Upload photos from your visit to build the gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {media.map((item: any) => (
              <a
                key={item.id}
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, overflow: "hidden", textDecoration: "none", display: "block" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.file_url}
                  alt={item.caption ?? "media"}
                  style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
                />
                {item.caption && (
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 12, color: "#5A5247", margin: 0 }} className="truncate">{item.caption}</p>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
