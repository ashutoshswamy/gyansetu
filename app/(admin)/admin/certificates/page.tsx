import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Award } from "lucide-react";
import type { Certificate } from "@/types";

const typeColors: Record<string, { color: string; bg: string }> = {
  participation: { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  excellence:    { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  leadership:    { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  mentor:        { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
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
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Certificates</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{(certs ?? []).length} certificates issued</p>
          </div>
          <Link href="/admin/certificates/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + Issue Certificate
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(counts).map(([type, count]) => {
            const c = typeColors[type];
            return (
              <div key={type} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "16px 18px" }}>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 6 }}>{type}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {(certs ?? []).length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No certificates issued yet.</p>
          )}
          {(certs ?? []).map((cert: Omit<Certificate, "user" | "tour"> & {
            users?: { name: string; email: string };
            tours?: { title: string };
            issuer?: { name: string };
          }) => {
            const c = typeColors[cert.certificate_type] ?? typeColors.participation;
            return (
              <div key={cert.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Award size={18} style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{cert.users?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: c.color, background: c.bg, textTransform: "capitalize" }}>
                      {cert.certificate_type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9188" }}>
                    {cert.users?.email} · {cert.tours?.title ?? "General"} · Issued by {cert.issuer?.name} · {new Date(cert.issued_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
