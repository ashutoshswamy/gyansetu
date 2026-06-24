import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { publishNewsletter, deleteNewsletter } from "@/actions/newsletter";

interface Newsletter {
  id: string;
  title: string;
  issue_number: number | null;
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

export default async function AdminNewsletterPage() {
  const db = createServerClient();
  const { data: newsletters } = await db
    .from("newsletters")
    .select("id, title, issue_number, status, published_at, created_at")
    .order("created_at", { ascending: false });

  const items = (newsletters ?? []) as Newsletter[];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>Newsletters</h1>
            <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>{items.length} issues total</p>
          </div>
          <Link href="/admin/newsletter/new">
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
              + New Newsletter
            </button>
          </Link>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
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
                  border: "1px solid #E4DFD1",
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
                          color: "#F5A520",
                          background: "rgba(245,165,32,0.10)",
                          borderRadius: 4,
                          padding: "2px 7px",
                          flexShrink: 0,
                        }}
                      >
                        #{item.issue_number}
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
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
                      {item.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                    {item.status === "published"
                      ? `Published ${formatDate(item.published_at)}`
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
                      await deleteNewsletter(item.id);
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
