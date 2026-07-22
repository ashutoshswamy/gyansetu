import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { approveTestimonial, declineTestimonial, deleteTestimonial } from "@/actions/public-forms";

type Status = "pending" | "approved" | "declined";

interface Testimonial {
  id: string;
  name: string;
  batch_year: string | null;
  role: string | null;
  message: string;
  status: Status;
  created_at: string;
}

const statusStyles: Record<Status, { color: string; background: string; label: string }> = {
  pending: { color: "#F5A520", background: "rgba(245,165,32,0.12)", label: "Pending" },
  approved: { color: "#2A5E3A", background: "rgba(42,94,58,0.08)", label: "Approved" },
  declined: { color: "#C0392B", background: "rgba(192,57,43,0.08)", label: "Declined" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max) + "…";
}

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeTab = (["pending", "approved", "declined"] as const).includes(statusParam as Status)
    ? (statusParam as Status)
    : "all";

  const db = createServerClient();
  const { data } = await db
    .from("testimonials")
    .select("id, name, batch_year, role, message, status, created_at")
    .order("created_at", { ascending: false });

  const testimonials = (data ?? []) as Testimonial[];
  const counts = {
    all: testimonials.length,
    pending: testimonials.filter((t) => t.status === "pending").length,
    approved: testimonials.filter((t) => t.status === "approved").length,
    declined: testimonials.filter((t) => t.status === "declined").length,
  };

  const visible = activeTab === "all" ? testimonials : testimonials.filter((t) => t.status === activeTab);

  const tabs: { key: "all" | Status; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "declined", label: "Declined" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>Testimonials</h1>
          <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>{counts.all} total submissions</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {(["pending", "approved", "declined"] as Status[]).map((s) => (
            <div key={s} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: statusStyles[s].color, margin: "0 0 6px" }}>
                {statusStyles[s].label}
              </p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#19140F", margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
                {counts[s]}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid #E4DFD1" }}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.key === "all" ? "/admin/testimonials" : `/admin/testimonials?status=${tab.key}`}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 14px",
                  color: isActive ? "#4A55BE" : "#9B9188",
                  borderBottom: isActive ? "2px solid #4A55BE" : "2px solid transparent",
                  textDecoration: "none",
                }}
              >
                {tab.label} {tab.key !== "all" && `(${counts[tab.key as Status]})`}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No testimonials in this view.
            </p>
          )}

          {visible.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                background: "white",
                border: "1px solid #E4DFD1",
                borderRadius: 10,
                padding: "16px 18px",
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{t.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: statusStyles[t.status].color,
                      background: statusStyles[t.status].background,
                    }}
                  >
                    {statusStyles[t.status].label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9B9188", marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {t.batch_year && <span>Batch: {t.batch_year}</span>}
                  {t.role && <span>Role: {t.role}</span>}
                  <span>Submitted {formatDate(t.created_at)}</span>
                </div>
                {t.message.length > 100 ? (
                  <details>
                    <summary style={{ fontSize: 13, color: "#5A5247", lineHeight: 1.55, cursor: "pointer" }}>
                      {truncate(t.message, 100)}
                    </summary>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: "6px 0 0", lineHeight: 1.55 }}>
                      {t.message}
                    </p>
                  </details>
                ) : (
                  <p style={{ fontSize: 13, color: "#5A5247", margin: 0, lineHeight: 1.55 }}>
                    {t.message}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 2 }}>
                {t.status !== "approved" && (
                  <form
                    action={async () => {
                      "use server";
                      await approveTestimonial(t.id);
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
                      Approve
                    </button>
                  </form>
                )}
                {t.status !== "declined" && (
                  <form
                    action={async () => {
                      "use server";
                      await declineTestimonial(t.id);
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        background: "transparent",
                        color: "#B8860B",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 14px",
                        borderRadius: 5,
                        border: "1.5px solid rgba(184,134,11,0.30)",
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                  </form>
                )}
                <form
                  action={async () => {
                    "use server";
                    await deleteTestimonial(t.id);
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
          ))}
        </div>
      </div>
    </div>
  );
}
