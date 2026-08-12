import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import {
  fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, Eyebrow,
} from "@/components/landing/theme";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Browse photos from Gyan-Setu's educational tours and volunteer activities across India, organized by category.",
  alternates: { canonical: "/gallery" },
};

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
    <main
      className={fontVars}
      style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)", padding: "64px 24px 96px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Eyebrow>Gyan-Setu Memories</Eyebrow>
          </div>
          <h1 style={{
            fontFamily: F_DISPLAY,
            fontSize: "clamp(32px,4vw,50px)",
            fontWeight: 600,
            color: "var(--gs-text)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Gallery
          </h1>
          <p style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-soft)", marginTop: 14, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            A collection of moment from our journeys.
          </p>
        </div>

        {cats.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "64px 24px",
            background: "var(--gs-paper-deep)",
            border: "1px dashed var(--gs-line)",
            borderRadius: 4,
            fontFamily: F_BODY,
            color: "var(--gs-text-mute)",
            fontSize: 15,
          }}>
            No images yet. Check back soon.
          </div>
        )}

        {cats.map((category) => (
          <div key={category.id} style={{ marginBottom: 64 }}>
            {/* Category header */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px dashed var(--gs-line)" }}>
              <h2 style={{
                fontFamily: F_DISPLAY,
                fontSize: 24,
                fontWeight: 600,
                fontStyle: "italic",
                color: "var(--gs-text)",
                margin: 0,
              }}>
                {category.name}
              </h2>
              {category.description && (
                <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-soft)", marginTop: 6 }}>
                  {category.description}
                </p>
              )}
            </div>

            {/* Masonry grid */}
            {(category.gallery_images ?? []).length === 0 ? (
              <p style={{ fontFamily: F_BODY, fontSize: 13, color: "var(--gs-text-mute)", padding: "24px 0" }}>
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
                      background: "var(--gs-paper-deep)",
                      border: "1px dashed var(--gs-line)",
                      borderRadius: 4,
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
                        fontFamily: F_MONO,
                        fontSize: 11,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "var(--gs-text-mute)",
                        padding: "10px 12px",
                        margin: 0,
                        borderTop: "1px dashed var(--gs-line)",
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
    </main>
  );
}
