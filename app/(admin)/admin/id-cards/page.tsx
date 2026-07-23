import Link from "next/link";
import { IdCard } from "lucide-react";
import { getAllIdCards } from "@/actions/id-cards";
import { DeleteIdCardButton } from "./delete-button";

export default async function AdminIdCardsPage() {
  const cards = await getAllIdCards();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>ID Cards</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{cards.length} cards issued</p>
          </div>
          <Link href="/admin/id-cards/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + Issue ID Card
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {cards.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No ID cards issued yet.</p>
          )}
          {cards.map((card: (typeof cards)[number]) => (
            <div key={card.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(74,85,190,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IdCard size={18} style={{ color: "#4A55BE" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#19140F" }}>{card.volunteer?.name ?? "Unknown"}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                    {card.card_number}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9B9188" }}>
                  {card.volunteer?.email}
                  {card.tour?.title && ` · ${card.tour.title} (${card.tour.destination})`}
                  {card.group?.name && ` · ${card.group.name}`}
                  {" · "}Valid {new Date(card.valid_from).toLocaleDateString()} – {new Date(card.valid_to).toLocaleDateString()}
                  {card.card_file_url && (
                    <>
                      {" · "}
                      <a href={card.card_file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#4A55BE" }}>View File</a>
                    </>
                  )}
                </div>
              </div>
              <DeleteIdCardButton id={card.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
