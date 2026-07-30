import { createServerClient } from "@/lib/supabase/server";
import { Mail } from "lucide-react";
import {
  fontVars, pageVars, F_DISPLAY, F_BODY, F_MONO, btnInk, Eyebrow,
} from "@/components/landing/theme";

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

export const revalidate = 60;

export default async function NewsletterPage() {
  const db = createServerClient();
  const { data: newsletters } = await db
    .from("newsletters")
    .select("id, title, description, file_url, issue_number, published_at, created_at")
    .eq("status", "published")
    .order("issue_number", { ascending: false });

  const items = (newsletters ?? []) as Newsletter[];

  return (
    <div className={fontVars} style={{ ...pageVars, fontFamily: F_BODY, minHeight: "100vh", background: "var(--gs-paper)" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--gs-line)", background: "var(--gs-paper-deep)", padding: "56px 24px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Eyebrow>Gyan Setu Updates</Eyebrow>
          <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: 0, lineHeight: 1.12 }}>
            Newsletter
          </h1>
          <p style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-soft)", marginTop: 12, maxWidth: 480, lineHeight: 1.7 }}>
            Periodic updates, highlights, and announcements from the Gyan Setu program.
          </p>
        </div>
      </div>

      {/* Newsletter list */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Mail size={40} style={{ color: "var(--gs-line)", margin: "0 auto 12px" }} />
            <p style={{ fontFamily: F_BODY, fontSize: 16, fontWeight: 600, color: "var(--gs-text)", marginBottom: 4 }}>No newsletters yet</p>
            <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-mute)" }}>The first issue is on its way. Stay tuned!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  background: "var(--gs-paper-deep)",
                  border: "1px dashed var(--gs-line)",
                  borderRadius: 3,
                  padding: "26px 24px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {/* Issue badge */}
                <div style={{ marginBottom: 14 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: F_MONO,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--gs-paper)",
                      background: "var(--gs-ink)",
                      borderRadius: 3,
                      padding: "3px 9px",
                    }}
                  >
                    {item.issue_number != null ? `Issue #${item.issue_number}` : "Newsletter"}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{ fontFamily: F_DISPLAY, fontSize: 19, fontWeight: 600, color: "var(--gs-text)", margin: "0 0 8px", lineHeight: 1.35 }}>
                  {item.title}
                </h2>

                {/* Description */}
                {item.description && (
                  <p
                    style={{
                      fontFamily: F_BODY,
                      fontSize: 13.5,
                      color: "var(--gs-text-soft)",
                      lineHeight: 1.65,
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
                  <p style={{ fontFamily: F_MONO, fontSize: 11, color: "var(--gs-text-mute)", letterSpacing: "0.04em", marginBottom: 16 }}>
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
                      ...btnInk,
                      justifyContent: "center",
                      fontSize: 12.5,
                      padding: "10px 18px",
                      marginTop: "auto",
                      width: "fit-content",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download / View
                  </a>
                ) : (
                  <span style={{ fontFamily: F_BODY, fontSize: 12, color: "var(--gs-text-mute)", fontStyle: "italic", marginTop: "auto" }}>
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
