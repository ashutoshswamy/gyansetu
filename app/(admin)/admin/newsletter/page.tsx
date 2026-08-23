import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { publishNewsletter, deleteNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";

interface Newsletter {
  id: string;
  title: string;
  issue_number: number | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

const statusStyle: Record<string, { color: string; background: string }> = {
  draft:     { color: "var(--gs-muted)", background: "rgba(var(--gs-muted-rgb), 0.10)" },
  published: { color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" },
};


export default async function AdminNewsletterPage() {
  const db = createServerClient();
  const { data: newsletters } = await db
    .from("newsletters")
    .select("id, title, issue_number, status, published_at, created_at")
    .order("created_at", { ascending: false });

  const items = (newsletters ?? []) as Newsletter[];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Newsletters</h1>
            <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginTop: 4 }}>{items.length} issues total</p>
          </div>
          <Button render={<Link href="/admin/newsletter/new" />}>
            + New Newsletter
          </Button>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No newsletters yet. Create your first issue.
            </p>
          )}

          {items.map((item) => {
            const s = statusStyle[item.status] ?? statusStyle.draft;
            return (
              <div
                key={item.id}
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
                    {item.issue_number != null && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--gs-warning)",
                          background: "rgba(var(--gs-warning-rgb), 0.10)",
                          borderRadius: 4,
                          padding: "2px 7px",
                          flexShrink: 0,
                        }}
                      >
                        #{item.issue_number}
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </span>
                    <Badge style={{color: s.color, background: s.background, flexShrink: 0, textTransform: "capitalize"}}>
                      {item.status}
                    </Badge>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                    {item.status === "published"
                      ? `Published ${formatDate(item.published_at!)}`
                      : `Created ${formatDate(item.created_at)}`}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {item.status === "draft" && (
                    <form
                      action={async () => {
                        "use server";
                        await publishNewsletter(item.id);
                      }}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        Publish
                      </Button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deleteNewsletter(item.id);
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
