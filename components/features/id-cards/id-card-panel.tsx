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

const INK = "#1C1710";
const PARCHMENT = "#FBF7EE";
const INDIGO = "#2E3570";
const INDIGO_TEXT = "#C7CCEF";
const GOLD = "#A67C27";
const GOLD_LIGHT = "#DCC98F";
const HAIRLINE = "#E1D9C2";
const MUTED = "#8A8071";

const sans = "var(--font-poppins), system-ui, sans-serif";
const display = "var(--font-cormorant), Georgia, serif";
const mono = "var(--font-geist-mono), monospace";

const faceStyle: React.CSSProperties = {
  width: CARD_W,
  height: CARD_H,
  background: PARCHMENT,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 10,
  overflow: "hidden",
  color: INK,
  position: "relative",
  boxShadow: "0 1px 3px rgba(28,23,16,0.08)",
};

function field(label: string, value?: string | null) {
  return (
    <div style={{ marginBottom: 3.5 }}>
      <span style={{ fontFamily: sans, fontSize: 7.5, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}{" "}
      </span>
      <span style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, color: INK }}>{value || "—"}</span>
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
    <div style={{ background: "white", border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: 24 }}>
      <div ref={cardRef} style={{ display: "flex", gap: 20, flexWrap: "wrap", background: "#F4F0E4", padding: 16 }}>
        {/* Front */}
        <div style={faceStyle}>
          <div style={{ background: INDIGO, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ lineHeight: 1.15, minWidth: 0 }}>
              <p style={{ fontFamily: sans, fontSize: 7, fontWeight: 600, letterSpacing: "0.1em", color: INDIGO_TEXT, textTransform: "uppercase", margin: 0 }}>
                Jnana Prabodhini &middot; EARC
              </p>
              <p style={{ fontFamily: display, fontStyle: "italic", fontSize: 17, fontWeight: 700, color: PARCHMENT, margin: "1px 0 0" }}>Gyan Setu</p>
            </div>
            <p
              style={{
                marginLeft: "auto",
                fontFamily: sans,
                fontSize: 6.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: INDIGO_TEXT,
                textTransform: "uppercase",
                textAlign: "right",
                lineHeight: 1.3,
              }}
            >
              Volunteer
              <br />
              Identity Card
            </p>
          </div>

          <div style={{ display: "flex", gap: 11, padding: "10px 12px", position: "relative" }}>
            <div style={{ flexShrink: 0 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Volunteer"
                  crossOrigin="anonymous"
                  style={{ width: 74, height: 90, borderRadius: 5, objectFit: "cover", border: `2px solid ${GOLD_LIGHT}`, display: "block" }}
                />
              ) : (
                <div style={{ width: 74, height: 90, borderRadius: 5, background: "#EFE9D6", border: `1px dashed ${GOLD_LIGHT}` }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: INK, margin: "0 0 5px", lineHeight: 1.2 }}>{data.name}</p>
              {field("State", data.state)}
              {field("Place", data.place)}
              {field("Valid From", new Date(data.valid_from).toLocaleDateString("en-IN"))}
              {field("Valid To", new Date(data.valid_to).toLocaleDateString("en-IN"))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 8,
              borderTop: `1px solid ${GOLD_LIGHT}`,
              paddingTop: 5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <p style={{ fontFamily: sans, fontSize: 7, fontWeight: 600, color: INK, margin: 0 }}>Issued by: Project Head</p>
              <p style={{ fontFamily: sans, fontSize: 6.5, color: MUTED, margin: 0 }}>Educational Activity Research Centre</p>
            </div>
            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.04em", color: GOLD, margin: 0, fontWeight: 700 }}>{data.card_number}</p>
          </div>
        </div>

        {/* Back */}
        <div style={{ ...faceStyle, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
          <p style={{ fontFamily: sans, fontSize: 8.5, fontWeight: 700, color: INK, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 7px" }}>
            Terms of Use
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {[
              "This is an official Gyan Setu Volunteer Identity Card issued by Jnana Prabodhini – EARC.",
              "Carry this card during all official Gyan Setu programmes, visits, workshops, and events.",
              "This card is personal, non-transferable, and valid only for the period shown on the front.",
              "If found, please contact the Gyan Setu team using the details below.",
            ].map((line, i) => (
              <li key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                <span style={{ width: 4, height: 4, marginTop: 4, background: GOLD, flexShrink: 0, transform: "rotate(45deg)" }} />
                <span style={{ fontFamily: sans, fontSize: 8, color: "#4A4235", lineHeight: 1.5 }}>{line}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "auto", borderTop: `1px solid ${HAIRLINE}`, paddingTop: 7 }}>
            <p style={{ fontFamily: sans, fontSize: 8, fontWeight: 700, color: INK, margin: "0 0 2px" }}>Gyan Setu &ndash; EARC, Jnana Prabodhini</p>
            <p style={{ fontFamily: sans, fontSize: 7.5, color: MUTED, margin: 0 }}>Email: ____________________</p>
            <p style={{ fontFamily: sans, fontSize: 7.5, color: MUTED, margin: 0 }}>Phone: ____________________</p>
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
          {downloading ? "Preparing..." : "Download Card (Front + Back)"}
        </button>

        {data.card_file_url && !looksLikeImage(data.card_file_url) && (
          <a href={data.card_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: INDIGO }}>
            View card file
          </a>
        )}
      </div>
    </div>
  );
}
