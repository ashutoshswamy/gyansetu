import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { publishPost, deletePost } from "@/actions/blog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

const statusStyle: Record<string, { color: string; background: string }> = {
  draft:     { color: "#9B9188", background: "rgba(155,145,136,0.10)" },
  published: { color: "#2A5E3A", background: "rgba(42,94,58,0.08)" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminBlogPage() {
  const db = createServerClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  const allPosts = (posts ?? []) as BlogPost[];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>Blog Posts</h1>
            <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>{allPosts.length} posts total</p>
          </div>
          <Link href="/admin/blog/new">
            <button
              style={{
                background: "#4A55BE",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              + New Post
            </button>
          </Link>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allPosts.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No blog posts yet. Create your first post.
            </p>
          )}

          {allPosts.map((post) => {
            const s = statusStyle[post.status] ?? statusStyle.draft;
            return (
              <div
                key={post.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "1px solid #E4DFD1",
                  borderRadius: 10,
                  padding: "14px 18px",
                  gap: 16,
                }}
              >
                {/* Left */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: s.color,
                        background: s.background,
                        flexShrink: 0,
                        textTransform: "capitalize",
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9188", display: "flex", gap: 16 }}>
                    <span>/{post.slug}</span>
                    <span>{post.status === "published" ? `Published ${formatDate(post.published_at)}` : `Created ${formatDate(post.created_at)}`}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {post.status === "draft" && (
                    <form
                      action={async () => {
                        "use server";
                        await publishPost(post.id);
                      }}
                    >
                      <button
                        type="submit"
                        style={{
                          background: "transparent",
                          color: "#2A5E3A",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 14px",
                          borderRadius: 5,
                          border: "1.5px solid rgba(42,94,58,0.30)",
                          cursor: "pointer",
                        }}
                      >
                        Publish
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deletePost(post.id);
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        background: "transparent",
                        color: "#C0392B",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 14px",
                        borderRadius: 5,
                        border: "1.5px solid rgba(192,57,43,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
