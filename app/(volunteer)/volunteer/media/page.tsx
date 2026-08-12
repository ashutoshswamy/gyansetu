"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { uploadMedia, getMediaByTour, getTodayUploadCount } from "@/actions/daily-logs";
import { getMyToursForSelect } from "@/actions/tours";
import { uploadFileToStorage } from "@/actions/upload";
import { Image as ImageIcon, Upload } from "lucide-react";
import type { MediaGalleryItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    getMyToursForSelect().then(data => {
      setTours(data);
      if (data[0]) setSelectedTour(data[0].id);
    });
    getTodayUploadCount().then(setTodayCount);
  }, []);

  useEffect(() => {
    if (!selectedTour) return;
    let isMounted = true;
    async function loadMedia() {
      setLoading(true);
      try {
        const data = await getMediaByTour(selectedTour);
        if (isMounted) setMedia(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMedia();
    return () => { isMounted = false; };
  }, [selectedTour]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTour) return;
    if (todayCount >= 2) {
      const msg = "Daily upload limit reached (2 media items per day). Please try again tomorrow.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let finalUrl = directUrl;
      let type: "photo" | "video" = "photo";

      if (mode === "upload") {
        const file = fileRef.current?.files?.[0];
        if (!file) {
          setError("Please select a file.");
          setUploading(false);
          return;
        }
        type = file.type.startsWith("video/") ? "video" : "photo";
        const fd = new FormData();
        fd.append("file", file);
        finalUrl = await uploadFileToStorage(fd, "media", selectedTour);
      }

      const item = await uploadMedia(selectedTour, finalUrl, caption || undefined, type);
      setMedia(prev => [item, ...prev]);
      setCaption("");
      setDirectUrl("");
      if (fileRef.current) fileRef.current.value = "";
      setTodayCount(c => c + 1);
      toast.success("Media uploaded successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload media";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Volunteer Portal</p>
          <h1 className="text-2xl font-bold text-foreground m-0">Media Uploads</h1>
          <p className="text-sm text-muted-foreground mt-1">Photos and videos from your tour activities</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            {todayCount >= 2 && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Daily upload limit reached ({todayCount}/2 uploaded today). You can only upload up to 2 media files per day. Please try again tomorrow.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 mb-4">
              <Select
                value={selectedTour}
                disabled={todayCount >= 2}
                onValueChange={(val) => setSelectedTour(val ?? "")}
                items={tours.map(t => ({ value: t.id, label: t.title }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tour..." />
                </SelectTrigger>
                <SelectContent>
                  {tours.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "upload" | "link")} disabled={todayCount >= 2} className="flex gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="mode-upload" />
                <Label htmlFor="mode-upload" className="text-xs font-semibold cursor-pointer">Upload Image/Video</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="mode-link" />
                <Label htmlFor="mode-link" className="text-xs font-semibold cursor-pointer">Direct Link</Label>
              </div>
            </RadioGroup>

            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                {mode === "upload" ? (
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    required
                    disabled={todayCount >= 2}
                  />
                ) : (
                  <Input
                    type="url"
                    value={directUrl}
                    onChange={e => setDirectUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required
                    disabled={todayCount >= 2}
                  />
                )}
              </div>
              <Input
                value={caption}
                disabled={todayCount >= 2}
                onChange={e => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={uploading || !selectedTour || todayCount >= 2}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {loading ? (
          <p style={{ color: "var(--gs-muted)", fontSize: 14 }}>Loading...</p>
        ) : media.length === 0 ? (
          <Card>
            <CardContent className="text-center pt-6">
              <ImageIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No media for this tour yet.</p>
              <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Upload photos from your visit to build the gallery.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {media.map((item) => (
              <Card key={item.id} className="p-0 gap-0">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  style={{ textDecoration: "none" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.file_url}
                    alt={item.caption ?? "media"}
                    style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
                  />
                  {item.caption && (
                    <div style={{ padding: "8px 10px" }}>
                      <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: 0 }} className="truncate">{item.caption}</p>
                    </div>
                  )}
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
