"use client";

import { useState, useEffect, useRef } from "react";
import { uploadMedia, getMediaByTour, getTodayUploadCount } from "@/actions/daily-logs";
import { uploadFileToStorage } from "@/actions/upload";
import { Image as ImageIcon, Upload } from "lucide-react";
import type { MediaGalleryItem } from "@/types";

export default function VolunteerMediaPage() {
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [selectedTour, setSelectedTour] = useState("");
  const [media, setMedia] = useState<MediaGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [directUrl, setDirectUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tours").then(r => r.json()).then(d => {
      const t = Array.isArray(d) ? d : [];
      setTours(t);
      if (t.length > 0) setSelectedTour(t[0].id);
    });
    getTodayUploadCount().then(setTodayCount).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedTour) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch kicked off right below
    setLoading(true);
    getMediaByTour(selectedTour)
      .then(d => { if (!cancelled) { setMedia(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTour]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (todayCount >= 2) {
      setError("Daily upload limit reached. You can only upload 2 media files per day.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let finalUrl = "";
      let isVideo = false;

      if (mode === "link") {
        if (!directUrl.startsWith("http://") && !directUrl.startsWith("https://")) {
          throw new Error("Invalid URL. Must start with http:// or https://");
        }
        finalUrl = directUrl.trim();
        const ext = finalUrl.split(".").pop()?.toLowerCase() ?? "";
        isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);
      } else {
        const file = fileRef.current?.files?.[0];
        if (!file || !selectedTour) return;

        const fd = new FormData();
        fd.append("file", file);
        finalUrl = await uploadFileToStorage(fd, "media", selectedTour);
        isVideo = file.type.startsWith("video/");
      }

      const item = await uploadMedia(selectedTour, finalUrl, caption || undefined, isVideo ? "video" : "photo");
      setMedia(prev => [item, ...prev]);
      setCaption("");
      setDirectUrl("");
      setTodayCount(prev => prev + 1);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
          {todayCount >= 2 && (
            <div style={{ background: "rgba(184,56,30,0.06)", border: "1.5px solid rgba(184,56,30,0.2)", borderRadius: 8, padding: "12px 16px", color: "#B8381E", fontSize: 13, marginBottom: 16 }}>
              Daily upload limit reached ({todayCount}/2 uploaded today). You can only upload up to 2 media files per day. Please try again tomorrow.
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <select
              value={selectedTour}
              disabled={todayCount >= 2}
              onChange={e => setSelectedTour(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", fontSize: 14, border: "1.5px solid #E4DFD1", borderRadius: 6, background: todayCount >= 2 ? "#F3F0E8" : "#FAFAF7", color: "#19140F", opacity: todayCount >= 2 ? 0.6 : 1 }}
            >
              {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "upload" ? "#2A5E3A" : "#5A5247", fontWeight: 600 }}>
              <input type="radio" disabled={todayCount >= 2} checked={mode === "upload"} onChange={() => setMode("upload")} style={{ accentColor: "#2A5E3A" }} />
              Upload Image/Video
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: mode === "link" ? "#2A5E3A" : "#5A5247", fontWeight: 600 }}>
              <input type="radio" disabled={todayCount >= 2} checked={mode === "link"} onChange={() => setMode("link")} style={{ accentColor: "#2A5E3A" }} />
              Direct Link
            </label>
          </div>

          <form onSubmit={handleUpload} className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              {mode === "upload" ? (
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  required
                  disabled={todayCount >= 2}
                  style={{ width: "100%", padding: "7px 12px", fontSize: 13, border: "1.5px solid #E4DFD1", borderRadius: 6, background: todayCount >= 2 ? "#F3F0E8" : "#FAFAF7", color: "#19140F", opacity: todayCount >= 2 ? 0.6 : 1 }}
                />
              ) : (
                <input
                  type="url"
                  value={directUrl}
                  onChange={e => setDirectUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  required
                  disabled={todayCount >= 2}
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: "1.5px solid #E4DFD1", borderRadius: 6, background: todayCount >= 2 ? "#F3F0E8" : "#FAFAF7", color: "#19140F", opacity: todayCount >= 2 ? 0.6 : 1 }}
                />
              )}
            </div>
            <input
              value={caption}
              disabled={todayCount >= 2}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              style={{ flex: 1, padding: "8px 12px", fontSize: 14, border: "1.5px solid #E4DFD1", borderRadius: 6, background: todayCount >= 2 ? "#F3F0E8" : "#FAFAF7", color: "#19140F", opacity: todayCount >= 2 ? 0.6 : 1 }}
            />
            <button
              type="submit"
              disabled={uploading || !selectedTour || todayCount >= 2}
              style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 6, border: "none", cursor: (uploading || todayCount >= 2) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (uploading || todayCount >= 2) ? 0.5 : 1 }}
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
            {media.map((item) => (
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
