import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO } from "@/components/landing/theme";
import { formatDate } from "@/lib/format-date";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = createServerClient();
  const { data: post } = await db
    .from("blog_posts")
    .select("title, excerpt, cover_image_url, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.published_at ?? undefined,
      images: [{ url: post.cover_image_url ?? "/og-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: [post.cover_image_url ?? "/og-image.png"],
    },
  };
}

export const revalidate = 60;

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: F_MONO,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "var(--gs-text-mute)",
  textDecoration: "none",
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const db = createServerClient();

  const { data: post } = await db
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const typedPost = post as BlogPost;

  return (
    <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: typedPost.title,
            description: typedPost.excerpt ?? undefined,
            image: typedPost.cover_image_url ?? undefined,
            datePublished: typedPost.published_at ?? undefined,
            publisher: { "@type": "Organization", name: "Gyan Setu" },
          }),
        }}
      />
      <style>{`
        .gs-back-link { transition: color .18s ease; }
        .gs-back-link:hover { color: var(--gs-rust); }
      `}</style>

      {/* Cover image */}
      {typedPost.cover_image_url && (
        <div style={{ width: "100%", maxHeight: 420, overflow: "hidden", borderBottom: "1px dashed var(--gs-line)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied URL, not a same-origin/whitelisted host for next/image */}
          <img
            src={typedPost.cover_image_url}
            alt={typedPost.title}
            style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Article */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 96px" }}>
        {/* Back link */}
        <Link href="/blog" className="gs-back-link" style={{ ...backLinkStyle, marginBottom: 36 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Blog
        </Link>

        {/* Meta */}
        {typedPost.published_at && (
          <p style={{ fontFamily: F_MONO, fontSize: 11.5, fontWeight: 500, color: "var(--gs-text-mute)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>
            {typedPost.published_at ? formatDate(typedPost.published_at) : ""}
          </p>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: F_DISPLAY,
            fontSize: "clamp(30px,4.5vw,44px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--gs-text)",
            lineHeight: 1.14,
            margin: "0 0 20px",
          }}
        >
          {typedPost.title}
        </h1>

        {/* Excerpt */}
        {typedPost.excerpt && (
          <p
            style={{
              fontFamily: F_DISPLAY,
              fontSize: 18,
              color: "var(--gs-rust)",
              lineHeight: 1.5,
              margin: "0 0 36px",
              fontStyle: "italic",
              fontWeight: 500,
              borderLeft: "3px solid var(--gs-rust)",
              paddingLeft: 20,
            }}
          >
            {typedPost.excerpt}
          </p>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px dashed var(--gs-line)", margin: "0 0 36px" }} />

        {/* Content */}
        <div
          style={{
            fontFamily: F_BODY,
            fontSize: 16,
            color: "var(--gs-text-soft)",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typedPost.content}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 28, borderTop: "1px dashed var(--gs-line)" }}>
          <Link href="/blog" className="gs-back-link" style={backLinkStyle}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
