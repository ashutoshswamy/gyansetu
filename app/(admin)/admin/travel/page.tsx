import Link from "next/link";
import { Train } from "lucide-react";
import { getAllTravelTickets } from "@/actions/travel";
import { ConfirmButton, ApproveItineraryButton } from "./row-actions";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:   { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  confirmed: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  cancelled: { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

export default async function AdminTravelPage() {
  const tickets = await getAllTravelTickets();

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Admin Console</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Travel & Tickets</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>{tickets.length} travel tickets</p>
          </div>
          <Link href="/admin/travel/new">
            <button style={{ background: "#4A55BE", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 5, border: "none", cursor: "pointer" }}>
              + New Ticket
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {tickets.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <Train className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
              <p style={{ fontSize: 15, color: "#5A5247" }}>No travel tickets yet.</p>
            </div>
          )}
          {tickets.map((t) => {
            const s = statusColors[t.confirmation_status] ?? statusColors.pending;
            return (
              <div key={t.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#19140F" }}>{t.group?.name ?? "Unknown group"}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {t.confirmation_status}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#5A5247", margin: 0 }}>
                      {t.departure_station || "?"} &rarr; {t.arrival_station || "?"}
                      {t.train_number ? ` · Train ${t.train_number}` : ""}
                      {t.pnr ? ` · PNR ${t.pnr}` : ""}
                    </p>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: "4px 0 0" }}>
                      {t.departure_at ? new Date(t.departure_at).toLocaleString() : "No departure time"}
                      {t.arrival_at ? ` → ${new Date(t.arrival_at).toLocaleString()}` : ""}
                    </p>
                    {t.ticket_file_url && (
                      <a href={t.ticket_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", marginTop: 4, display: "inline-block" }}>
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
