import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Newspaper, ArrowRight } from "lucide-react";

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

export default async function BlogPage() {
  const db = createServerClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogPosts = (posts ?? []) as BlogPost[];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid #E4DFD1", background: "#F3F0E8", padding: "56px 24px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 10 }}>
            Stories from the Field
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#19140F", margin: 0, lineHeight: 1.2 }}>Blog</h1>
          <p style={{ fontSize: 15, color: "#5A5247", marginTop: 10, maxWidth: 480 }}>
            Experiences, insights, and updates from students and coordinators across tours.
          </p>
        </div>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {blogPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <FileText size={40} style={{ color: "#E4DFD1", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 4 }}>No posts yet</p>
            <p style={{ fontSize: 14, color: "#9B9188" }}>Check back soon for stories from the field.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {blogPosts.map((post) => (
              <article
                key={post.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4DFD1",
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s",
                }}
              >
                {/* Cover */}
                {post.cover_image_url ? (
                  <div style={{ height: 180, overflow: "hidden" }}>
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
                      background: "linear-gradient(135deg, rgba(74,85,190,0.08) 0%, rgba(245,165,32,0.10) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Newspaper size={40} style={{ color: "#D4CFC6" }} />
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: "20px 20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {post.published_at && (
                    <p style={{ fontSize: 11, color: "#9B9188", marginBottom: 8, letterSpacing: "0.04em" }}>
                      {formatDate(post.published_at)}
                    </p>
                  )}
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: "0 0 8px", lineHeight: 1.35 }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#5A5247",
                        lineHeight: 1.6,
                        margin: "0 0 16px",
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
                    <Link href={`/blog/${post.slug}`}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#4A55BE",
                          textDecoration: "none",
                        }}
                      >
                        Read More
                        <ArrowRight size={14} />
                      </span>
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
