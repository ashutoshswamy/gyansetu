import { auth } from "@clerk/nextjs/server";
import { getMyCertificates } from "@/actions/certificates";
import { Award } from "lucide-react";

const typeColors: Record<string, { color: string; bg: string; border: string }> = {
  participation: { color: "#4A55BE", bg: "rgba(74,85,190,0.05)", border: "rgba(74,85,190,0.2)" },
  excellence:    { color: "#2A5E3A", bg: "rgba(42,94,58,0.05)", border: "rgba(42,94,58,0.2)" },
  leadership:    { color: "#6B21A8", bg: "rgba(107,33,168,0.05)", border: "rgba(107,33,168,0.2)" },
  mentor:        { color: "#F5A520", bg: "rgba(245,165,32,0.05)", border: "rgba(245,165,32,0.2)" },
};

export default async function VolunteerCertificatesPage() {
  const certs = await getMyCertificates();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My Certificates</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{certs.length} certificate{certs.length !== 1 ? "s" : ""} earned</p>
        </div>

        {certs.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <Award className="w-12 h-12 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247", marginBottom: 4 }}>No certificates yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>Certificates will appear here after tour completion and admin review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(certs as any[]).map((cert) => {
              const c = typeColors[cert.certificate_type] ?? typeColors.participation;
              return (
                <div
                  key={cert.id}
                  style={{ background: "white", border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden" }}
                >
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: c.bg }} />
                  <div className="flex items-start gap-4">
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Award size={22} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1">
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: c.color }}>{cert.certificate_type}</span>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#19140F", margin: "4px 0 6px" }}>Certificate of {cert.certificate_type.charAt(0).toUpperCase() + cert.certificate_type.slice(1)}</h3>
                      {cert.tours?.title && (
                        <p style={{ fontSize: 13, color: "#5A5247", margin: "0 0 4px" }}>{cert.tours.title} · {cert.tours.destination}</p>
                      )}
                      <div style={{ fontSize: 12, color: "#9B9188" }}>
                        Issued by {cert.issuer?.name ?? "Admin"} · {new Date(cert.issued_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      {cert.notes && (
                        <p style={{ fontSize: 12, color: "#5A5247", marginTop: 8, padding: "6px 10px", background: c.bg, borderRadius: 5 }}>{cert.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
