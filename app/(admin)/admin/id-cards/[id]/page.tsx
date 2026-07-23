import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIdCard } from "@/actions/id-cards";
import { IdCardPanel } from "@/components/features/id-cards/id-card-panel";

export default async function AdminIdCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getIdCard(id);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/id-cards" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A5247", marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back to ID Cards
          </Link>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>ID Card</h1>
        </div>

        <IdCardPanel
          data={{
            name: card.volunteer?.name ?? "Unknown",
            photo_url: card.volunteer?.volunteer_profiles?.photo_url,
            card_number: card.card_number,
            valid_from: card.valid_from,
            valid_to: card.valid_to,
            tour_title: card.tour?.title,
            tour_destination: card.tour?.destination,
            group_name: card.group?.name,
            card_file_url: card.card_file_url,
          }}
        />
      </div>
    </div>
  );
}
