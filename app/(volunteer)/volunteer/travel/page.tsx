import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { getTravelTicketForMyGroup, getLocationUpdatesForGroup } from "@/actions/travel";
import { Train, MapPin } from "lucide-react";
import { LocationUpdateForm } from "./location-update-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:   { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  confirmed: { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  cancelled: { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
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
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Travel</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Tickets, itinerary and live location updates{group ? ` for ${group.name}` : ""}</p>
        </div>

        {!group ? (
          <Card>
<CardContent className="text-center">
            <Train className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p style={{ fontSize: 15, color: "var(--gs-text-secondary)", marginBottom: 4 }}>Not assigned to any group yet.</p>
            <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>An admin will assign you to a tour group.</p>
          </CardContent>
</Card>
        ) : (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 12px" }}>Travel Tickets</h2>
            <div className="space-y-3 mb-8">
              {tickets.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No travel tickets have been issued yet.</p>
              )}
              {tickets.map((t) => {
                const s = statusColors[t.confirmation_status] ?? statusColors.pending;
                return (
                  <Card key={t.id}>
<CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <Train size={15} style={{ color: "var(--gs-accent)" }} />
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
                  </CardContent>
</Card>
                );
              })}
            </div>

            <LocationUpdateForm groupId={group.id} />

            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: "0 0 12px" }}>Location Updates</h2>
            <div className="space-y-3">
              {updates.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--gs-muted)" }}>No location updates posted yet.</p>
              )}
              {updates.map((u) => (
                <Card key={u.id}>
<CardContent className="flex gap-3">
                  <MapPin size={16} style={{ color: "var(--gs-accent)", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {u.status_type && (
                        <Badge style={{color: "var(--gs-accent)", background: "rgba(var(--gs-accent-rgb), 0.08)"}}>
                          {statusTypeLabels[u.status_type] ?? u.status_type}
                        </Badge>
                      )}
                      <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>{new Date(u.created_at).toLocaleString()}</span>
                    </div>
                    {u.note && <p style={{ fontSize: 14, color: "var(--foreground)", margin: "2px 0" }}>{u.note}</p>}
                    {(u.from_location || u.to_location) && (
                      <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>{u.from_location || "?"} → {u.to_location || "?"}</p>
                    )}
                    <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "2px 0 0" }}>Posted by {u.poster?.name ?? "Unknown"}</p>
                  </div>
                </CardContent>
</Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
