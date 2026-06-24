import { createServerClient } from "@/lib/supabase/server";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Newsletter — Gyan Setu",
  description: "Stay updated with Gyan Setu newsletters.",
};

interface Newsletter {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  issue_number: number | null;
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

export default async function NewsletterPage() {
  const db = createServerClient();
  const { data: newsletters } = await db
    .from("newsletters")
    .select("id, title, description, file_url, issue_number, published_at, created_at")
    .eq("status", "published")
    .order("issue_number", { ascending: false });

  const items = (newsletters ?? []) as Newsletter[];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid #E4DFD1", background: "#F3F0E8", padding: "56px 24px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 10 }}>
            Gyan Setu Updates
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#19140F", margin: 0, lineHeight: 1.2 }}>Newsletter</h1>
          <p style={{ fontSize: 15, color: "#5A5247", marginTop: 10, maxWidth: 480 }}>
            Periodic updates, highlights, and announcements from the Gyan Setu program.
          </p>
        </div>
      </div>

      {/* Newsletter list */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Mail size={40} style={{ color: "#E4DFD1", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#19140F", marginBottom: 4 }}>No newsletters yet</p>
            <p style={{ fontSize: 14, color: "#9B9188" }}>The first issue is on its way. Stay tuned!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4DFD1",
                  borderRadius: 12,
                  padding: "24px 24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {/* Issue badge */}
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#F5A520",
                      background: "rgba(245,165,32,0.10)",
                      borderRadius: 4,
                      padding: "3px 8px",
                    }}
                  >
                    {item.issue_number != null ? `Issue #${item.issue_number}` : "Newsletter"}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: "0 0 8px", lineHeight: 1.35 }}>
                  {item.title}
                </h2>

                {/* Description */}
                {item.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#5A5247",
                      lineHeight: 1.6,
                      margin: "0 0 16px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </p>
                )}

                {/* Date */}
                {item.published_at && (
                  <p style={{ fontSize: 11, color: "#9B9188", marginBottom: 16 }}>
                    {formatDate(item.published_at)}
                  </p>
                )}

                {/* Action */}
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      background: "#4A55BE",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      textDecoration: "none",
                      marginTop: "auto",
                      cursor: "pointer",
                      width: "fit-content",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download / View
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "#9B9188", fontStyle: "italic", marginTop: "auto" }}>
                    File coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
