import { createServerClient } from "@/lib/supabase/server";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

interface GalleryCategory {
  id: string;
  name: string;
  description: string | null;
  gallery_images: GalleryImage[];
}

export const revalidate = 60;

export default async function GalleryPage() {
  const db = createServerClient();

  const { data: categories } = await db
    .from("gallery_categories")
    .select("id, name, description, gallery_images(id, url, caption, created_at)")
    .order("created_at", { ascending: true });

  const cats = (categories as GalleryCategory[]) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#F5A520",
            marginBottom: 10,
          }}>
            Jnana Pravas Memories
          </p>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#19140F",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Gallery
          </h1>
          <p style={{ fontSize: 15, color: "#5A5247", marginTop: 10, maxWidth: 480, margin: "10px auto 0" }}>
            A collection of moments from our student exchange journeys.
          </p>
        </div>

        {cats.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "80px 0",
            color: "#9B9188",
            fontSize: 15,
          }}>
            No images yet. Check back soon.
          </div>
        )}

        {cats.map((category) => (
          <div key={category.id} style={{ marginBottom: 56 }}>
            {/* Category header */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#19140F",
                margin: 0,
              }}>
                {category.name}
              </h2>
              {category.description && (
                <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>
                  {category.description}
                </p>
              )}
              <div style={{
                width: 40,
                height: 3,
                background: "#4A55BE",
                borderRadius: 99,
                marginTop: 10,
              }} />
            </div>

            {/* Masonry grid */}
            {(category.gallery_images ?? []).length === 0 ? (
              <p style={{ fontSize: 13, color: "#9B9188", padding: "24px 0" }}>
                No images in this category yet.
              </p>
            ) : (
              <div style={{
                columns: "3 280px",
                gap: 16,
              }}>
                {(category.gallery_images ?? []).map((image) => (
                  <div
                    key={image.id}
                    style={{
                      breakInside: "avoid",
                      marginBottom: 16,
                      background: "white",
                      border: "1px solid #E4DFD1",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied URL, not a same-origin/whitelisted host for next/image */}
                    <img
                      src={image.url}
                      alt={image.caption ?? category.name}
                      style={{
                        width: "100%",
                        display: "block",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                    {image.caption && (
                      <p style={{
                        fontSize: 12,
                        color: "#5A5247",
                        padding: "8px 12px",
                        margin: 0,
                        borderTop: "1px solid #E4DFD1",
                      }}>
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
