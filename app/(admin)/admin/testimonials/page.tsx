import { createServerClient } from "@/lib/supabase/server";
import { approveTestimonial, deleteTestimonial } from "@/actions/public-forms";

interface Testimonial {
  id: string;
  name: string;
  batch_year: string | null;
  role: string | null;
  message: string;
  is_approved: boolean;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max) + "…";
}

export default async function AdminTestimonialsPage() {
  const db = createServerClient();
  const { data } = await db
    .from("testimonials")
    .select("id, name, batch_year, role, message, is_approved, created_at")
    .order("created_at", { ascending: false });

  const testimonials = (data ?? []) as Testimonial[];
  const pending = testimonials.filter((t) => !t.is_approved).length;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin Console
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>Testimonials</h1>
          <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>
            {testimonials.length} total · {pending} pending review
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {testimonials.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No testimonials submitted yet.
            </p>
          )}

          {testimonials.map((t) => (
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
                      color: t.is_approved ? "#2A5E3A" : "#F5A520",
                      background: t.is_approved ? "rgba(42,94,58,0.08)" : "rgba(245,165,32,0.12)",
                    }}
                  >
                    {t.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9B9188", marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {t.batch_year && <span>Batch: {t.batch_year}</span>}
                  {t.role && <span>Role: {t.role}</span>}
                  <span>Submitted {formatDate(t.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: "#5A5247", margin: 0, lineHeight: 1.55 }}>
                  {truncate(t.message, 120)}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 2 }}>
                {!t.is_approved && (
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
