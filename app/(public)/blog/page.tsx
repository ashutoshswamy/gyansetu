import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Newspaper, ArrowRight } from "lucide-react";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, Eyebrow } from "@/components/landing/theme";

export const metadata = {
  title: "Blog — Gyan Setu",
  description: "Stories and updates from the field.",
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const revalidate = 60;

export default async function BlogPage() {
  const db = createServerClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogPosts = (posts ?? []) as BlogPost[];

  return (
    <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)" }}>
      <style>{`
        .gs-blog-card { transition: transform .2s ease, border-color .2s ease; }
        .gs-blog-card:hover { transform: translateY(-3px); border-color: var(--gs-rust); }
        .gs-read-more { transition: color .18s ease; }
        .gs-read-more:hover { color: var(--gs-rust); }
        .gs-read-more svg { transition: transform .18s ease; }
        .gs-read-more:hover svg { transform: translateX(2px); }
      `}</style>

      {/* Hero */}
      <div style={{ background: "var(--gs-paper-deep)", borderBottom: "1px dashed var(--gs-line)", padding: "64px 24px 56px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Eyebrow>Stories from the Field</Eyebrow>
          <h1
            style={{
              fontFamily: F_DISPLAY, fontSize: "clamp(34px,4.5vw,52px)", fontWeight: 600,
              fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--gs-text)", margin: 0, lineHeight: 1.12,
            }}
          >
            Blog
          </h1>
          <p style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", marginTop: 14, maxWidth: 520, lineHeight: 1.7 }}>
            Experiences, insights, and updates from students and coordinators across tours.
          </p>
        </div>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px 96px" }}>
        {blogPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 4 }}>
            <FileText size={36} style={{ color: "var(--gs-line)", margin: "0 auto 14px" }} />
            <p style={{ fontFamily: F_BODY, fontSize: 16, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 4px" }}>No posts yet</p>
            <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-mute)", margin: 0 }}>Check back soon for stories from the field.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 22,
            }}
          >
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="gs-blog-card"
                style={{
                  background: "var(--gs-paper-deep)",
                  border: "1px dashed var(--gs-line)",
                  borderRadius: 4,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Cover */}
                {post.cover_image_url ? (
                  <div style={{ height: 180, overflow: "hidden", borderBottom: "1px dashed var(--gs-line)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied URL, not a same-origin/whitelisted host for next/image */}
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: 180,
                      background: "linear-gradient(135deg, rgba(232,163,61,.14) 0%, rgba(184,73,46,.12) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: "1px dashed var(--gs-line)",
                    }}
                  >
                    <Newspaper size={34} stroke="var(--gs-rust)" strokeWidth={1.5} />
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: "22px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {post.published_at && (
                    <p style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gs-text-mute)", margin: "0 0 10px" }}>
                      {formatDate(post.published_at)}
                    </p>
                  )}
                  <h2 style={{ fontFamily: F_DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--gs-text)", margin: "0 0 10px", lineHeight: 1.32 }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p
                      style={{
                        fontFamily: F_BODY,
                        fontSize: 13.5,
                        color: "var(--gs-text-soft)",
                        lineHeight: 1.65,
                        margin: "0 0 18px",
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: post.excerpt ? 0 : 16 }}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="gs-read-more"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: F_MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "var(--gs-text)",
                        textDecoration: "none",
                      }}
                    >
                      Read More
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
