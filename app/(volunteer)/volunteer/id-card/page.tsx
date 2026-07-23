import { IdCard as IdCardIcon } from "lucide-react";
import { getMyIdCard } from "@/actions/id-cards";

function looksLikeImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

export default async function VolunteerIdCardPage() {
  const card = await getMyIdCard();
  const photo = card?.photo_url || (card?.card_file_url && looksLikeImage(card.card_file_url) ? card.card_file_url : undefined);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>My ID Card</h1>
        </div>

        {!card ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <IdCardIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247" }}>No ID card issued yet.</p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
            <div style={{
              background: "linear-gradient(135deg, #4A55BE 0%, #363F91 100%)",
              borderRadius: 12, padding: 24, color: "white", marginBottom: 20,
            }}>
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
                    style={{ width: 96, height: 96, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{card.name}</p>
                  {card.tour?.title && <p style={{ fontSize: 13, opacity: 0.85 }}>{card.tour.title} · {card.tour.destination}</p>}
                  {card.group?.name && <p style={{ fontSize: 13, opacity: 0.85 }}>Group: {card.group.name}</p>}
                </div>
              </div>
              <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Card Number</p>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 16 }}>{card.card_number}</p>
              <div className="flex justify-between">
                <div>
                  <p style={{ fontSize: 10, opacity: 0.7 }}>Valid From</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{new Date(card.valid_from).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, opacity: 0.7 }}>Valid To</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{new Date(card.valid_to).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {card.card_file_url && !looksLikeImage(card.card_file_url) && (
              <a href={card.card_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#4A55BE" }}>
                View card file
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
