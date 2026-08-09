import { createServerClient } from "@/lib/supabase/server";
import { getGroupsByTour } from "@/actions/groups";
import Link from "next/link";
import { ArrowLeft, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminLocationsTourPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const db = createServerClient();
  const [{ data: tour }, groups] = await Promise.all([
    db.from("tours").select("title").eq("id", tourId).maybeSingle(),
    getGroupsByTour(tourId),
  ]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/locations" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--gs-muted)", marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Tours
        </Link>

        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>
            Volunteer Locations
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{tour?.title ?? "Tour"}</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Select a group to view live volunteer locations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.length === 0 && (
            <p style={{ color: "var(--gs-muted)", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No groups for this tour yet.
            </p>
          )}
          {groups.map((group) => (
            <Link key={group.id} href={`/admin/locations/${tourId}/${group.id}`}>
              <Card>
<CardContent>
                <div className="flex items-center justify-between">
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{group.name}</h3>
                  {group.state_allocated && (
                    <span className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--gs-success)" }}>
                      <MapPin size={11} /> {group.state_allocated}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2" style={{ fontSize: 12, color: "var(--gs-muted)" }}>
                  <Users size={11} />
                  <span>{group.tour_group_members?.length ?? 0} members</span>
                </div>
              </CardContent>
</Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
