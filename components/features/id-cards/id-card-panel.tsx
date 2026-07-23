"use client";

import { useRef, useState } from "react";
import { IdCard as IdCardIcon, Download } from "lucide-react";
import { toPng } from "html-to-image";

export interface IdCardPanelData {
  name: string;
  photo_url?: string | null;
  card_number: string;
  valid_from: string;
  valid_to: string;
  tour_title?: string | null;
  tour_destination?: string | null;
  group_name?: string | null;
  card_file_url?: string | null;
}

function looksLikeImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

export function IdCardPanel({ data }: { data: IdCardPanelData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const photo = data.photo_url || (data.card_file_url && looksLikeImage(data.card_file_url) ? data.card_file_url : undefined);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
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
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(135deg, #4A55BE 0%, #363F91 100%)",
          borderRadius: 12, padding: 24, color: "white", marginBottom: 20,
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <IdCardIcon size={20} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Gyan Setu Volunteer</span>
        </div>
        <div className="flex items-start gap-4 mb-4">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="ID card"
              crossOrigin="anonymous"
              style={{ width: 96, height: 96, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}
            />
          )}
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{data.name}</p>
            {data.tour_title && <p style={{ fontSize: 13, opacity: 0.85 }}>{data.tour_title} · {data.tour_destination}</p>}
            {data.group_name && <p style={{ fontSize: 13, opacity: 0.85 }}>Group: {data.group_name}</p>}
          </div>
        </div>
        <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Card Number</p>
        <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 16 }}>{data.card_number}</p>
        <div className="flex justify-between">
          <div>
            <p style={{ fontSize: 10, opacity: 0.7 }}>Valid From</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{new Date(data.valid_from).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, opacity: 0.7 }}>Valid To</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{new Date(data.valid_to).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
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
          {downloading ? "Preparing..." : "Download Card"}
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
