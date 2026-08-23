import { getMyCertificates } from "@/actions/certificates";
import { Award } from "lucide-react";
import Link from "next/link";
import type { CertificateType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";

type CertificateRow = {
  id: string;
  certificate_type: CertificateType;
  issued_at: string;
  notes?: string;
  tours?: { id: string; title: string; destination: string } | null;
  issuer?: { id: string; name: string } | null;
};

const typeColors: Record<string, { color: string; bg: string; border: string }> = {
  participation: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.05)", border: "rgba(var(--gs-accent-rgb), 0.2)" },
  excellence:    { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.05)", border: "rgba(var(--gs-success-rgb), 0.2)" },
  leadership:    { color: "#6B21A8", bg: "rgba(107,33,168,0.05)", border: "rgba(107,33,168,0.2)" },
  mentor:        { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.05)", border: "rgba(var(--gs-warning-rgb), 0.2)" },
};

export default async function VolunteerCertificatesPage() {
  const certs = await getMyCertificates();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>My Certificates</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{certs.length} certificate{certs.length !== 1 ? "s" : ""} earned</p>
        </div>

        {certs.length === 0 ? (
          <Card>
<CardContent className="text-center">
            <Award className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)", marginBottom: 4 }}>No certificates yet.</p>
            <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>Certificates will appear here after tour completion and admin review.</p>
          </CardContent>
</Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(certs as CertificateRow[]).map((cert) => {
              const c = typeColors[cert.certificate_type] ?? typeColors.participation;
              return (
                <Link
                  key={cert.id}
                  href={`/volunteer/certificates/${cert.id}`}
                  style={{ background: "white", border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden", textDecoration: "none", display: "block" }}
                >
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: c.bg }} />
                  <div className="flex items-start gap-4">
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Award size={22} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1">
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: c.color }}>{cert.certificate_type}</span>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: "4px 0 6px" }}>Certificate of {cert.certificate_type.charAt(0).toUpperCase() + cert.certificate_type.slice(1)}</h3>
                      {cert.tours?.title && (
                        <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>{cert.tours.title} · {cert.tours.destination}</p>
                      )}
                      <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                        Issued by {cert.issuer?.name ?? "Admin"} · {formatDate(cert.issued_at)}
                      </div>
                      {cert.notes && (
                        <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", marginTop: 8, padding: "6px 10px", background: c.bg, borderRadius: 5 }}>{cert.notes}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
