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

const INK = "#1C1710";
const PARCHMENT = "#FBF7EE";
const INDIGO = "#2E3570";
const GOLD = "#A67C27";
const GOLD_LIGHT = "#DCC98F";
const HAIRLINE = "#E1D9C2";
const MUTED = "#8A8071";

const sans = "var(--font-plex-sans), system-ui, sans-serif";
const display = "var(--font-cormorant), Georgia, serif";
const mono = "var(--font-geist-mono), monospace";

function CornerMark({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const size = 26;
  const base: React.CSSProperties = { position: "absolute", width: size, height: size };
  const pos: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
    tr: { top: 8, right: 8, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
    bl: { bottom: 8, left: 8, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
    br: { bottom: 8, right: 8, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
  };
  return <div style={{ ...base, ...pos[corner] }} />;
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
    <div style={{ minWidth: 130 }}>
      <p style={{ fontFamily: sans, fontSize: 8.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, margin: "0 0 3px" }}>
        {label}
      </p>
      <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: INK, borderBottom: `1px solid ${GOLD_LIGHT}`, paddingBottom: 3, margin: 0 }}>
        {value || " "}
      </p>
    </div>
  );

  return (
    <div style={{ background: "white", border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: 24, overflowX: "auto" }}>
      <div
        ref={certRef}
        style={{
          width: 760,
          maxWidth: "100%",
          margin: "0 auto",
          background: PARCHMENT,
          padding: 8,
          border: `1px solid ${GOLD_LIGHT}`,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            position: "relative",
            border: `1.5px solid ${GOLD}`,
            borderRadius: 2,
            padding: "44px 60px",
            color: INK,
            overflow: "hidden",
          }}
        >
          <CornerMark corner="tl" />
          <CornerMark corner="tr" />
          <CornerMark corner="bl" />
          <CornerMark corner="br" />

          <div style={{ position: "relative", textAlign: "center" }}>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", color: INK, margin: 0, textTransform: "uppercase" }}>
              Jnana Prabodhini
            </p>
            <p style={{ fontFamily: sans, fontSize: 10, letterSpacing: "0.06em", color: MUTED, margin: "3px 0 0" }}>
              Educational Activity Research Centre (EARC)
            </p>
            <p style={{ fontFamily: display, fontStyle: "italic", fontSize: 17, fontWeight: 700, color: GOLD, letterSpacing: "0.03em", margin: "6px 0 22px" }}>
              Gyan Setu
            </p>

            <h1 style={{ fontFamily: display, fontSize: 38, fontWeight: 700, letterSpacing: "0.01em", margin: "0 0 22px", color: INK }}>
              Certificate of Appreciation
            </h1>

            <p style={{ fontFamily: sans, fontSize: 13, color: MUTED, margin: "0 0 8px" }}>This certificate is proudly awarded to</p>
            <p
              style={{
                fontFamily: display,
                fontStyle: "italic",
                fontSize: 30,
                fontWeight: 700,
                margin: "0 0 24px",
                color: INK,
              }}
            >
              {data.name}
            </p>

            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.75, margin: "0 0 14px", color: "#3A3327" }}>
                In recognition of your voluntary initiative, wholehearted participation, and valuable contribution to
                the <strong>Gyan-Setu</strong> programme.
              </p>
              <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.75, margin: "0 0 14px", color: "#3A3327" }}>
                During the programme, you successfully conducted <strong>Science and Mathematics workshops</strong>{" "}
                for middle school students and facilitated the <strong>&ldquo;Know Our Country&rdquo;</strong>{" "}
                exhibition in remote areas of the state, inspiring young minds through experiential learning and
                fostering national integration.
              </p>
              <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.7, margin: "0 0 4px", color: "#3A3327" }}>
                Your dedication, enthusiasm, and commitment are sincerely appreciated.
              </p>
              <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, margin: "0 0 26px", color: INK }}>
                We wish you continued success in all your future endeavours.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 30, flexWrap: "wrap", marginBottom: 26 }}>
              {field("State", data.state)}
              {field("Place", data.place)}
              {field("Duration of Visit", data.duration_of_visit)}
              {field("Volunteer ID", data.volunteer_code)}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap", margin: "0 0 22px" }}>
              {[
                { title: "Project Head", org: "Gyan Setu - EARC" },
                { title: "Head of Department", org: "Educational Activity Research Centre - EARC" },
              ].map((sig) => (
                <div key={sig.title} style={{ width: 180 }}>
                  <div style={{ height: 50 }} />
                  <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6 }}>
                    <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, margin: 0, color: INK }}>{sig.title}</p>
                    <p style={{ fontFamily: sans, fontSize: 10.5, color: MUTED, margin: "2px 0 0" }}>{sig.org}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: 16 }}>
              <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, margin: 0, color: INK }}>Issued by Gyan-Setu EARC</p>
              <p style={{ fontFamily: sans, fontSize: 9.5, color: MUTED, fontStyle: "italic", margin: "2px 0 0" }}>
                This is a digitally generated certificate and is valid without a physical signature or seal.
              </p>
            </div>
            <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.05em", color: MUTED, margin: "14px 0 0" }}>
              Issued {new Date(data.issued_at).toLocaleDateString("en-IN")}
              {data.volunteer_code ? ` · ${data.volunteer_code}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 20 }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: INDIGO, color: "white", fontSize: 13, fontWeight: 600,
            fontFamily: sans,
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
