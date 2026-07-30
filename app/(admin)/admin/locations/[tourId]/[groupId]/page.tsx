"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getGroupVolunteerLocations } from "@/actions/locations";
import { createClientClient } from "@/lib/supabase/client";
import { ArrowLeft, Radio } from "lucide-react";
import type { VolunteerLocation } from "@/components/features/locations/volunteer-map";
import { VolunteerLocationTable } from "@/components/features/locations/volunteer-location-table";

const VolunteerMap = dynamic(
  () => import("@/components/features/locations/volunteer-map").then((m) => m.VolunteerMap),
  { ssr: false }
);

export default function AdminLocationsGroupPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.tourId as string;
  const groupId = params.groupId as string;

  const [locations, setLocations] = useState<VolunteerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupLabel, setGroupLabel] = useState<{ groupName: string; tourTitle: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/groups/${groupId}`)
      .then((r) => r.json())
      .then((data: { name?: string; tours?: { title?: string } }) => {
        if (!isMounted || !data?.name) return;
        setGroupLabel({ groupName: data.name, tourTitle: data.tours?.title ?? "Untitled Tour" });
      })
      .catch(() => {});

    async function refresh() {
      const data = await getGroupVolunteerLocations(groupId);
      if (!isMounted) return;
      setLocations(data);
      setLoading(false);
    }

    refresh();

    const clientDb = createClientClient();
    const channel = clientDb
      .channel(`admin-locations-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_locations" }, () => refresh())
      .subscribe();

    return () => {
      isMounted = false;
      clientDb.removeChannel(channel);
    };
  }, [groupId]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF7EC" }}>
      <div className="p-4 sm:p-8 pb-4">
        <button
          onClick={() => router.push(`/admin/locations/${tourId}`)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9B9188", background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Back to Groups
        </button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
              {groupLabel ? groupLabel.tourTitle : "Volunteer Locations"}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>
              {groupLabel ? groupLabel.groupName : "Live Map"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#2A5E3A" }}>
            <Radio size={13} />
            <span>{locations.length} sharing now</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 pb-8" style={{ minHeight: 480 }}>
        <div style={{ height: "70vh", minHeight: 420, borderRadius: 10, overflow: "hidden", border: "1px solid #E4DFD1" }}>
          {loading ? (
            <div className="h-full flex items-center justify-center" style={{ color: "#9B9188", fontSize: 14 }}>Loading map...</div>
          ) : locations.length === 0 ? (
            <div className="h-full flex items-center justify-center" style={{ color: "#9B9188", fontSize: 14 }}>No volunteers currently sharing their location.</div>
          ) : (
            <VolunteerMap locations={locations} />
          )}
        </div>

        {!loading && <div className="mt-6"><VolunteerLocationTable locations={locations} /></div>}
      </div>
    </div>
  );
}
