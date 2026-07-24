"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

export interface CertificatePanelData {
  name: string;
  state?: string | null;
  place?: string | null;
  duration_of_visit?: string | null;
  volunteer_code?: string | null;
  issued_at: string;
}

export function CertificatePanel({ data }: { data: CertificatePanelData }) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${data.name.replace(/\s+/g, "_")}_certificate.png`;
      a.click();
    } catch (err) {
      console.error("[CertificatePanel] download failed", err);
    } finally {
      setDownloading(false);
    }
  }

  const field = (label: string, value?: string | null) => (
    <div style={{ minWidth: 140 }}>
      <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9188", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", borderBottom: "1px solid #D8CFA8", paddingBottom: 2, minWidth: 120 }}>
        {value || " "}
      </p>
    </div>
  );

  return (
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
      <div
        ref={certRef}
        style={{
          background: "#FFFDF7",
          border: "3px double #B8952E",
          borderRadius: 4,
          padding: "40px 56px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          color: "#2A2418",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", margin: 0 }}>JNANA PRABODHINI</p>
        <p style={{ fontSize: 11, letterSpacing: "0.06em", color: "#5A5247", margin: "2px 0 0" }}>
          Educational Activity Research Centre (EARC)
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#B8952E", letterSpacing: "0.1em", margin: "2px 0 18px" }}>Gyan-Setu</p>

        <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 20px", color: "#19140F" }}>Certificate of Appreciation</h1>

        <p style={{ fontSize: 14, margin: "0 0 6px" }}>This certificate is proudly awarded to</p>
        <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 20px", borderBottom: "1px solid #B8952E", display: "inline-block", padding: "0 24px 6px" }}>
          {data.name}
        </p>

        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 auto 16px", maxWidth: 620, textAlign: "justify" }}>
          In recognition of your voluntary initiative, wholehearted participation, and valuable contribution to the{" "}
          <strong>Gyan-Setu</strong> programme.
        </p>

        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 auto 16px", maxWidth: 620, textAlign: "justify" }}>
          During the programme, you successfully conducted <strong>Science and Mathematics workshops</strong> for
          middle school students and facilitated the <strong>&ldquo;Know Our Country&rdquo;</strong> exhibition in
          remote areas of the state, inspiring young minds through experiential learning and fostering national
          integration.
        </p>

        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 0 6px" }}>
          Your dedication, enthusiasm, and commitment are sincerely appreciated.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 28px" }}>
          We wish you continued success in all your future endeavours.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
          {field("State", data.state)}
          {field("Place", data.place)}
          {field("Duration of Visit", data.duration_of_visit)}
          {field("Volunteer ID", data.volunteer_code)}
        </div>

        <div style={{ borderTop: "1px solid #E4DFD1", paddingTop: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Issued by: Project Head - Swapnil Indapurkar</p>
          <p style={{ fontSize: 10.5, color: "#9B9188", fontStyle: "italic", margin: 0 }}>
            This is a digitally generated certificate and is valid without a physical signature or seal.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 20 }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600,
            padding: "8px 16px", borderRadius: 6, border: "none",
            cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1,
          }}
        >
          <Download size={14} />
          {downloading ? "Preparing..." : "Download Certificate"}
        </button>
      </div>
    </div>
  );
}
