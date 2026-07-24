import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyCertificate } from "@/actions/certificates";
import { CertificatePanel } from "@/components/features/certificates/certificate-panel";

export default async function VolunteerCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await getMyCertificate(id);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/volunteer/certificates" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A5247", marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back to My Certificates
          </Link>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Certificate</h1>
        </div>

        <CertificatePanel
          data={{
            name: cert.recipient?.name ?? "Unknown",
            state: cert.state,
            place: cert.place,
            duration_of_visit: cert.duration_of_visit,
            volunteer_code: cert.volunteer_code,
            issued_at: cert.issued_at,
          }}
        />
      </div>
    </div>
  );
}
