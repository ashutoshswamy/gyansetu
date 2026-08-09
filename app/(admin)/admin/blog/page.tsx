import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { publishPost, deletePost } from "@/actions/blog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

const statusStyle: Record<string, { color: string; background: string }> = {
  draft:     { color: "var(--gs-muted)", background: "rgba(var(--gs-muted-rgb), 0.10)" },
  published: { color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" },
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
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Blog Posts</h1>
            <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginTop: 4 }}>{allPosts.length} posts total</p>
          </div>
          <Link href="/admin/blog/new">
            <Button>+ New Post</Button>
          </Link>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allPosts.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
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
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  gap: 16,
                }}
              >
                {/* Left */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.title}
                    </span>
                    <Badge style={{color: s.color, background: s.background, flexShrink: 0, textTransform: "capitalize"}}>
                      {post.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gs-muted)", display: "flex", gap: 16 }}>
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
                      <Button type="submit" variant="outline" size="sm" className="text-[var(--gs-success)] border-[var(--gs-success)]/30 hover:bg-[var(--gs-success)]/10">
                        Publish
                      </Button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deletePost(post.id);
                    }}
                  >
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
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
