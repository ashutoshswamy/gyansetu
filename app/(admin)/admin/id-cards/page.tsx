import Link from "next/link";
import { IdCard } from "lucide-react";
import { getAllIdCards } from "@/actions/id-cards";
import { DeleteIdCardButton } from "./delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format-date";

export default async function AdminIdCardsPage() {
  const cards = await getAllIdCards();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>ID Cards</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{cards.length} cards issued</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/id-cards/bulk">
              <Button variant="outline">Bulk Generate</Button>
            </Link>
            <Link href="/admin/id-cards/new">
              <Button>+ Issue ID Card</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {cards.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>No ID cards issued yet.</p>
          )}
          {cards.map((card: (typeof cards)[number]) => (
            <Card key={card.id}>
<CardContent className="flex items-center gap-4">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(var(--gs-accent-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IdCard size={18} style={{ color: "var(--gs-accent)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>{card.volunteer?.name ?? "Unknown"}</span>
                  <Badge style={{color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)"}}>
                    {card.card_number}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                  {card.volunteer?.email}
                  {card.tour?.title && ` · ${card.tour.title} (${card.tour.destination})`}
                  {card.group?.name && ` · ${card.group.name}`}
                  {" · "}Valid {formatDateRange(card.valid_from, card.valid_to)}
                </div>
              </div>
              <Link href={`/admin/id-cards/${card.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--gs-accent)", flexShrink: 0 }}>
                View
              </Link>
              <DeleteIdCardButton id={card.id} />
            </CardContent>
</Card>
          ))}
        </div>
      </div>
    </div>
  );
}
