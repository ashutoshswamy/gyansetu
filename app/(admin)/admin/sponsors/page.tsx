import { createServerClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/features/export-button";

interface SponsorInquiry {
  id: string;
  organization_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  sponsorship_type: string | null;
  message: string | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminSponsorsPage() {
  const db = createServerClient();
  const { data } = await db
    .from("sponsor_inquiries")
    .select("id, organization_name, contact_name, email, phone, sponsorship_type, message, created_at")
    .order("created_at", { ascending: false });

  const inquiries = (data ?? []) as SponsorInquiry[];

  const exportData = inquiries.map((i) => ({
    "Organization": i.organization_name,
    "Contact Name": i.contact_name,
    "Email": i.email,
    "Phone": i.phone ?? "",
    "Sponsorship Type": i.sponsorship_type ?? "",
    "Message": i.message ?? "",
    "Submitted At": formatDate(i.created_at),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#19140F", margin: 0 }}>Sponsor Inquiries</h1>
            <p style={{ fontSize: 13, color: "#5A5247", marginTop: 4 }}>{inquiries.length} inquiries total</p>
          </div>
          <ExportButton data={exportData} filename="sponsor-inquiries.csv" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inquiries.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No sponsor inquiries yet.
            </p>
          )}

          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              style={{
                background: "white",
                border: "1px solid #E4DFD1",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{inquiry.organization_name}</span>
                    {inquiry.sponsorship_type && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          color: "#4A55BE",
                          background: "rgba(74,85,190,0.08)",
                        }}
                      >
                        {inquiry.sponsorship_type}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>Submitted {formatDate(inquiry.created_at)}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px 20px", marginBottom: inquiry.message ? 10 : 0 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9188", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</span>
                  <p style={{ fontSize: 13, color: "#19140F", margin: "2px 0 0" }}>{inquiry.contact_name}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9188", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</span>
                  <p style={{ fontSize: 13, color: "#19140F", margin: "2px 0 0" }}>{inquiry.email}</p>
                </div>
                {inquiry.phone && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9188", textTransform: "uppercase", letterSpacing: "0.06em" }}>Phone</span>
                    <p style={{ fontSize: 13, color: "#19140F", margin: "2px 0 0" }}>{inquiry.phone}</p>
                  </div>
                )}
              </div>

              {inquiry.message && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F0E8" }}>
                  <p style={{ fontSize: 13, color: "#5A5247", margin: 0, lineHeight: 1.55 }}>{inquiry.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
