import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getTravelTicketForMyGroup, getLocationUpdatesForGroup } from "@/actions/travel";
import { Train, MapPin } from "lucide-react";
import { LocationUpdateForm } from "./location-update-form";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:   { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  confirmed: { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  cancelled: { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

const statusTypeLabels: Record<string, string> = {
  current_location: "Current Location",
  train_delay: "Train Delay",
  arrival_estimate: "Arrival Estimate",
  other: "Other",
};

export default async function VolunteerTravelPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: currentUser } = await db.from("users").select("id").eq("clerk_id", userId!).single();
  const { data: membership } = await db
    .from("tour_group_members")
    .select("tour_groups(id, name)")
    .eq("user_id", currentUser?.id ?? "")
    .limit(1)
    .maybeSingle();

  const group = membership?.tour_groups as unknown as { id: string; name: string } | null;

  const [tickets, updates] = group
    ? await Promise.all([
        getTravelTicketForMyGroup(group.id),
        getLocationUpdatesForGroup(group.id),
      ])
    : [[], []];

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Travel</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Tickets, itinerary and live location updates{group ? ` for ${group.name}` : ""}</p>
        </div>

        {!group ? (
          <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <Train className="w-10 h-10 mx-auto mb-3" style={{ color: "#E4DFD1" }} />
            <p style={{ fontSize: 15, color: "#5A5247", marginBottom: 4 }}>Not assigned to any group yet.</p>
            <p style={{ fontSize: 13, color: "#9B9188" }}>An admin will assign you to a tour group.</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 12px" }}>Travel Tickets</h2>
            <div className="space-y-3 mb-8">
              {tickets.length === 0 && (
                <p style={{ fontSize: 13, color: "#9B9188" }}>No travel tickets have been issued yet.</p>
              )}
              {tickets.map((t) => {
                const s = statusColors[t.confirmation_status] ?? statusColors.pending;
                return (
                  <div key={t.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Train size={15} style={{ color: "#4A55BE" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                        {t.confirmation_status}
                      </span>
                      {t.itinerary_approved && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#2A5E3A", background: "rgba(42,94,58,0.08)" }}>
                          Itinerary Approved
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "#19140F", margin: "6px 0 2px" }}>
                      {t.departure_station || "?"} &rarr; {t.arrival_station || "?"}
                      {t.train_number ? ` · Train ${t.train_number}` : ""}
                      {t.pnr ? ` · PNR ${t.pnr}` : ""}
                    </p>
                    <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                      {t.departure_at ? new Date(t.departure_at).toLocaleString() : "No departure time"}
                      {t.arrival_at ? ` → ${new Date(t.arrival_at).toLocaleString()}` : ""}
                    </p>
                    {t.ticket_file_url && (
                      <a href={t.ticket_file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", marginTop: 6, display: "inline-block" }}>
                        View ticket file
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            <LocationUpdateForm groupId={group.id} />

            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", margin: "0 0 12px" }}>Location Updates</h2>
            <div className="space-y-3">
              {updates.length === 0 && (
                <p style={{ fontSize: 13, color: "#9B9188" }}>No location updates posted yet.</p>
              )}
              {updates.map((u) => (
                <div key={u.id} style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12 }}>
                  <MapPin size={16} style={{ color: "#4A55BE", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {u.status_type && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: "#4A55BE", background: "rgba(74,85,190,0.08)" }}>
                          {statusTypeLabels[u.status_type] ?? u.status_type}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#9B9188" }}>{new Date(u.created_at).toLocaleString()}</span>
                    </div>
                    {u.note && <p style={{ fontSize: 14, color: "#19140F", margin: "2px 0" }}>{u.note}</p>}
                    {(u.latitude != null && u.longitude != null) && (
                      <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>{u.latitude}, {u.longitude}</p>
                    )}
                    <p style={{ fontSize: 12, color: "#9B9188", margin: "2px 0 0" }}>Posted by {u.poster?.name ?? "Unknown"}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
