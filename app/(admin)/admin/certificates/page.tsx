import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Award } from "lucide-react";
import type { Certificate } from "@/types";
import { DeleteCertificateButton } from "./delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeColors: Record<string, { color: string; bg: string }> = {
  participation: { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  excellence:    { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  leadership:    { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  mentor:        { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
};

export default async function AdminCertificatesPage() {
  const db = createServerClient();

  const { data: certs } = await db
    .from("certificates")
    .select(`
      *,
      users!certificates_user_id_fkey(id, name, email),
      tours(id, title),
      issuer:users!certificates_issued_by_fkey(id, name)
    `)
    .order("issued_at", { ascending: false });

  const counts = { participation: 0, excellence: 0, leadership: 0, mentor: 0 };
  for (const c of certs ?? []) counts[c.certificate_type as keyof typeof counts]++;

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Certificates</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{(certs ?? []).length} certificates issued</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/certificates/bulk">
              <Button variant="outline">Bulk Generate</Button>
            </Link>
            <Link href="/admin/certificates/new">
              <Button>+ Issue Certificate</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(counts).map(([type, count]) => {
            const c = typeColors[type];
            return (
              <Card key={type}>
<CardContent>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gs-muted)", marginBottom: 6 }}>{type}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
              </CardContent>
</Card>
            );
          })}
        </div>

        <div className="space-y-3">
          {(certs ?? []).length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No certificates issued yet.</p>
          )}
          {(certs ?? []).map((cert: Omit<Certificate, "user" | "tour"> & {
            users?: { name: string; email: string };
            tours?: { title: string };
            issuer?: { name: string };
          }) => {
            const c = typeColors[cert.certificate_type] ?? typeColors.participation;
            return (
              <Card key={cert.id}>
<CardContent className="flex items-center gap-4">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Award size={18} style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{cert.users?.name ?? "Unknown"}</span>
                    <Badge style={{color: c.color, background: c.bg, textTransform: "capitalize"}}>
                      {cert.certificate_type}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                    {cert.users?.email} · {cert.tours?.title ?? "General"} · Issued by {cert.issuer?.name} · {new Date(cert.issued_at).toLocaleDateString()}
                  </div>
                </div>
                <Link href={`/admin/certificates/${cert.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-accent)", flexShrink: 0 }}>
                  View
                </Link>
                <DeleteCertificateButton id={cert.id} />
              </CardContent>
</Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
