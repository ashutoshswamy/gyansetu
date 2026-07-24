import { IdCard as IdCardIcon } from "lucide-react";
import { getMyIdCard } from "@/actions/id-cards";
import { IdCardPanel } from "@/components/features/id-cards/id-card-panel";

export default async function VolunteerIdCardPage() {
  const card = await getMyIdCard();

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
          <IdCardPanel
            data={{
              name: card.name ?? "",
              photo_url: card.photo_url,
              card_number: card.card_number,
              valid_from: card.valid_from,
              valid_to: card.valid_to,
              state: card.state,
              place: card.place,
              tour_title: card.tour?.title,
              tour_destination: card.tour?.destination,
              group_name: card.group?.name,
              card_file_url: card.card_file_url,
            }}
          />
        )}
      </div>
    </div>
  );
}
