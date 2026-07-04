import { createServerClient } from "@/lib/supabase/server";
import { Image, FileText, Video } from "lucide-react";

const typeIcon: Record<string, React.ElementType> = {
  photo: Image,
  document: FileText,
  video: Video,
};

interface MediaRow {
  id: string;
  file_url: string;
  caption?: string;
  media_type: "photo" | "document" | "video";
  created_at: string;
  tours?: { id: string; title: string };
  users?: { id: string; name: string };
}

export default async function AdminMediaPage() {
  const db = createServerClient();

  const { data: media } = await db
    .from("media_gallery")
    .select("*, tours(id, title), users!media_gallery_uploaded_by_fkey(id, name)")
    .order("created_at", { ascending: false });

  const byTour: Record<string, MediaRow[]> = {};
  for (const m of media ?? []) {
    const key = m.tours?.title ?? "Unlinked";
    if (!byTour[key]) byTour[key] = [];
    byTour[key].push(m);
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Media Gallery</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            {(media ?? []).length} files · Photos, documents and videos from visits
          </p>
        </div>

        {Object.keys(byTour).length === 0 && (
          <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>No media uploaded yet.</p>
        )}

        {Object.entries(byTour).map(([tourTitle, items]) => (
          <div key={tourTitle} className="mb-8">
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#5A5247", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tourTitle} ({items.length})
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {items.map((item) => {
                const Icon = typeIcon[item.media_type] ?? Image;
                return (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, overflow: "hidden", textDecoration: "none", display: "block" }}
                  >
                    {item.media_type === "photo" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.file_url}
                        alt={item.caption ?? "photo"}
                        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F0E8" }}>
                        <Icon size={32} style={{ color: "#9B9188" }} />
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      {item.caption && <p style={{ fontSize: 13, color: "#19140F", margin: "0 0 2px", fontWeight: 500 }} className="truncate">{item.caption}</p>}
                      <p style={{ fontSize: 11, color: "#9B9188", margin: 0 }}>
                        {item.users?.name} · {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
