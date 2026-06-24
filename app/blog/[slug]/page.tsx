import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return { title: "Post Not Found — Gyan Setu" };

  return {
    title: `${post.title} — Gyan Setu Blog`,
    description: post.excerpt ?? undefined,
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
    <div style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      {/* Cover image */}
      {typedPost.cover_image_url && (
        <div style={{ width: "100%", maxHeight: 420, overflow: "hidden" }}>
          <img
            src={typedPost.cover_image_url}
            alt={typedPost.title}
            style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Article */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Back link */}
        <Link href="/blog">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#5A5247",
              textDecoration: "none",
              marginBottom: 32,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 12l-4-4 4-4" stroke="#5A5247" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Blog
          </span>
        </Link>

        {/* Meta */}
        {typedPost.published_at && (
          <p style={{ fontSize: 12, color: "#9B9188", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            {formatDate(typedPost.published_at)}
          </p>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: "#19140F",
            lineHeight: 1.25,
            margin: "0 0 16px",
          }}
        >
          {typedPost.title}
        </h1>

        {/* Excerpt */}
        {typedPost.excerpt && (
          <p
            style={{
              fontSize: 17,
              color: "#5A5247",
              lineHeight: 1.65,
              margin: "0 0 32px",
              fontStyle: "italic",
              borderLeft: "3px solid #F5A520",
              paddingLeft: 16,
            }}
          >
            {typedPost.excerpt}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "#E4DFD1", margin: "0 0 32px" }} />

        {/* Content */}
        <div
          style={{
            fontSize: 16,
            color: "#19140F",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typedPost.content}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid #E4DFD1" }}>
          <Link href="/blog">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#4A55BE",
                textDecoration: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M7 12l-4-4 4-4" stroke="#4A55BE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All Posts
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
