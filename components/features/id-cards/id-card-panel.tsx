"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

export interface IdCardPanelData {
  name: string;
  photo_url?: string | null;
  card_number: string;
  valid_from: string;
  valid_to: string;
  state?: string | null;
  place?: string | null;
  tour_title?: string | null;
  tour_destination?: string | null;
  group_name?: string | null;
  card_file_url?: string | null;
}

function looksLikeImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

const CARD_W = 340;
const CARD_H = 214;

const faceStyle: React.CSSProperties = {
  width: CARD_W,
  height: CARD_H,
  background: "#FFFDF7",
  border: "1px solid #E4DFD1",
  borderRadius: 12,
  overflow: "hidden",
  color: "#19140F",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

function field(label: string, value?: string | null) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#9B9188", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}: </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#19140F" }}>{value || "—"}</span>
    </div>
  );
}

export function IdCardPanel({ data }: { data: IdCardPanelData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const photo = data.photo_url || (data.card_file_url && looksLikeImage(data.card_file_url) ? data.card_file_url : undefined);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${data.card_number}.png`;
      a.click();
    } catch (err) {
      console.error("[IdCardPanel] download failed", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
      <div ref={cardRef} style={{ display: "flex", gap: 20, flexWrap: "wrap", background: "#FAFAF7", padding: 16 }}>
        {/* Front */}
        <div style={faceStyle}>
          <div style={{ background: "#EEF0FB", padding: "10px 14px", borderBottom: "2px solid #4A55BE" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#4A55BE", margin: 0 }}>JNANA PRABODHINI – EARC</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#19140F", margin: "1px 0 0" }}>Gyan Setu</p>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#5A5247", letterSpacing: "0.06em", textTransform: "uppercase", margin: "2px 0 0" }}>
              Volunteer Identity Card
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "10px 14px" }}>
            <div style={{ flexShrink: 0 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Volunteer"
                  crossOrigin="anonymous"
                  style={{ width: 76, height: 92, borderRadius: 6, objectFit: "cover", border: "1px solid #E4DFD1", display: "block" }}
                />
              ) : (
                <div style={{ width: 76, height: 92, borderRadius: 6, background: "#F0EEE6", border: "1px dashed #D8CFA8" }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#19140F", margin: "0 0 5px", lineHeight: 1.2 }}>{data.name}</p>
              {field("State", data.state)}
              {field("Place", data.place)}
              {field("Volunteer ID", data.card_number)}
              {field("Valid From", new Date(data.valid_from).toLocaleDateString("en-IN"))}
              {field("Valid To", new Date(data.valid_to).toLocaleDateString("en-IN"))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #E4DFD1", margin: "0 14px", paddingTop: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#19140F", margin: 0 }}>Issued by: Project Head – Gyan Setu</p>
            <p style={{ fontSize: 8.5, color: "#9B9188", margin: "1px 0 0" }}>Educational Activity Research Centre (EARC)</p>
            <p style={{ fontSize: 8.5, color: "#9B9188", margin: 0 }}>Jnana Prabodhini</p>
          </div>
        </div>

        {/* Back */}
        <div style={{ ...faceStyle, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#19140F", margin: "0 0 6px" }}>Instructions</p>
          <ol style={{ fontSize: 8.5, color: "#5A5247", lineHeight: 1.5, margin: 0, paddingLeft: 14 }}>
            <li>This is an official Gyan Setu Volunteer Identity Card issued by Jnana Prabodhini – Educational Activity Research Centre (EARC).</li>
            <li>Carry this card during all official Gyan Setu programmes, visits, workshops, and events.</li>
            <li>This card is personal, non-transferable, and valid only for the period mentioned on the front.</li>
            <li>If the card is lost, damaged, or found, please contact the Gyan Setu team immediately.</li>
          </ol>
          <div style={{ marginTop: "auto", borderTop: "1px solid #E4DFD1", paddingTop: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#19140F", margin: "0 0 2px" }}>Gyan Setu – Educational Activity Research Centre (EARC)</p>
            <p style={{ fontSize: 8.5, color: "#5A5247", margin: 0 }}>Email: ____________________</p>
            <p style={{ fontSize: 8.5, color: "#5A5247", margin: 0 }}>Phone: ____________________</p>
          </div>
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
          {downloading ? "Preparing..." : "Download Card (Front + Back)"}
        </button>

        {data.card_file_url && !looksLikeImage(data.card_file_url) && (
          <a href={data.card_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#4A55BE" }}>
            View card file
          </a>
        )}
      </div>
    </div>
  );
}
