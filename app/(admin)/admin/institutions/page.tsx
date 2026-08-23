import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/features/export-button";
import { formatDate } from "@/lib/format-date";

interface InstitutionInquiry {
  id: string;
  institution_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  institution_type: string | null;
  city: string | null;
  student_count: string | null;
  message: string | null;
  created_at: string;
}

export default async function AdminInstitutionsPage() {
  const db = createServerClient();
  const { data } = await db
    .from("institution_inquiries")
    .select("id, institution_name, contact_name, email, phone, institution_type, city, student_count, message, created_at")
    .order("created_at", { ascending: false });

  const inquiries = (data ?? []) as InstitutionInquiry[];

  const exportData = inquiries.map((i) => ({
    "Institution": i.institution_name,
    "Contact Name": i.contact_name,
    "Email": i.email,
    "Phone": i.phone ?? "",
    "Type": i.institution_type ?? "",
    "City": i.city ?? "",
    "Student Count": i.student_count ?? "",
    "Message": i.message ?? "",
    "Submitted At": formatDate(i.created_at),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Institution Inquiries</h1>
            <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", marginTop: 4 }}>{inquiries.length} inquiries total</p>
          </div>
          <ExportButton data={exportData} filename="institution-inquiries.csv" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inquiries.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No institution inquiries yet.
            </p>
          )}

          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="pt-4">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{inquiry.institution_name}</span>
                    {inquiry.institution_type && (
                      <Badge style={{ color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)" }}>
                        {inquiry.institution_type}
                      </Badge>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>Submitted {formatDate(inquiry.created_at)}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 20px", marginBottom: inquiry.message ? 10 : 0 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</span>
                  <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0" }}>{inquiry.contact_name}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</span>
                  <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0" }}>{inquiry.email}</p>
                </div>
                {inquiry.phone && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Phone</span>
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0" }}>{inquiry.phone}</p>
                  </div>
                )}
                {inquiry.city && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>City</span>
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0" }}>{inquiry.city}</p>
                  </div>
                )}
                {inquiry.student_count && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Student Count</span>
                    <p style={{ fontSize: 13, color: "var(--foreground)", margin: "2px 0 0" }}>{inquiry.student_count}</p>
                  </div>
                )}
              </div>

              {inquiry.message && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--gs-card)" }}>
                  <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: 0, lineHeight: 1.55 }}>{inquiry.message}</p>
                </div>
              )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
