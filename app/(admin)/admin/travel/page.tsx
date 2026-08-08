import Link from "next/link";
import { Train } from "lucide-react";
import { getAllTravelTickets } from "@/actions/travel";
import { ConfirmButton, ApproveItineraryButton } from "./row-actions";
import { Button } from "@/components/ui/button";

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
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <Train className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
              <p style={{ fontSize: 15, color: "var(--gs-text-secondary)" }}>No travel tickets yet.</p>
            </div>
          )}
          {tickets.map((t) => {
            const s = statusColors[t.confirmation_status] ?? statusColors.pending;
            return (
              <div key={t.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>{t.group?.name ?? "Unknown group"}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {t.confirmation_status}
                      </span>
                      {t.itinerary_approved && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "var(--gs-success)", background: "rgba(var(--gs-success-rgb), 0.08)" }}>
                          Itinerary Approved
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--foreground)", margin: "6px 0 2px" }}>
                      {t.departure_station || "?"} &rarr; {t.arrival_station || "?"}
                      {t.train_number ? ` · Train ${t.train_number}` : ""}
                      {t.train_name ? ` (${t.train_name})` : ""}
                      {t.pnr ? ` · PNR ${t.pnr}` : ""}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>
                      {t.departure_at ? new Date(t.departure_at).toLocaleString() : "No departure time"}
                      {t.arrival_at ? ` → ${new Date(t.arrival_at).toLocaleString()}` : ""}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
