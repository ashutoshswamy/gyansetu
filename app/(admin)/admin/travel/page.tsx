import Link from "next/link";
import { Train } from "lucide-react";
import { getAllTravelTickets } from "@/actions/travel";
import { ConfirmButton, ApproveItineraryButton } from "./row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format-date";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:   { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  confirmed: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  cancelled: { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
};

export default async function AdminTravelPage() {
  const tickets = await getAllTravelTickets();

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Travel & Tickets</h1>
            <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>{tickets.length} travel tickets</p>
          </div>
          <Link href="/admin/travel/new">
            <Button>+ New Ticket</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {tickets.length === 0 && (
            <Card>
<CardContent className="text-center">
              <Train className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No travel tickets yet.</p>
            </CardContent>
</Card>
          )}
          {tickets.map((t) => {
            const s = statusColors[t.confirmation_status] ?? statusColors.pending;
            return (
              <Card key={t.id}>
<CardContent>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{t.group?.name ?? "Unknown group"}</span>
                      <Badge style={{color: s.color, background: s.bg, textTransform: "capitalize"}}>
                        {t.confirmation_status}
                      </Badge>
                      {t.itinerary_approved && (
                        <Badge style={{color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)"}}>
                          Itinerary Approved
                        </Badge>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--foreground)", margin: "6px 0 2px" }}>
                      {t.departure_station || "?"} &rarr; {t.arrival_station || "?"}
                      {t.train_number ? ` · Train ${t.train_number}` : ""}
                      {t.train_name ? ` (${t.train_name})` : ""}
                      {t.pnr ? ` · PNR ${t.pnr}` : ""}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                      {t.departure_at ? formatDateTime(t.departure_at) : "No departure time"}
                      {t.arrival_at ? ` → ${formatDateTime(t.arrival_at)}` : ""}
                    </p>
                    {t.note && (
                      <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{t.note}</p>
                    )}
                    {t.ticket_file_url && (
                      <a href={t.ticket_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--gs-accent)", marginTop: 6, display: "inline-block" }}>
                        View ticket file
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ConfirmButton id={t.id} disabled={t.confirmation_status === "confirmed"} />
                    <ApproveItineraryButton id={t.id} approved={t.itinerary_approved} />
                  </div>
                </div>
              </CardContent>
</Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
