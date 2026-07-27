"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { VolunteerLocation } from "./volunteer-map";

// OpenStreetMap Nominatim reverse geocoding — free, no API key, but its usage
// policy caps public requests at ~1/sec, so lookups are queued and cached by
// rounded coordinate instead of firing one per row on every render.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return data.display_name ?? "Unknown location";
}

function coordKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function VolunteerLocationTable({ locations }: { locations: VolunteerLocation[] }) {
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const cacheRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Realtime refreshes hand back a brand-new `locations` array (new object
  // references) even when nobody's coordinates actually changed. Keying the
  // effect off the array itself restarted the geocoding queue on every
  // refresh, cancelling in-flight lookups whose coordinate was already
  // marked as claimed in cacheRef — permanently stuck on "Locating...".
  // Keying off the actual coordinate set instead means the effect only
  // re-runs when something real changes.
  const coordSignature = useMemo(
    () => locations.map((loc) => coordKey(loc.latitude, loc.longitude)).sort().join("|"),
    [locations]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    async function loadMissing() {
      const pending = locations.filter((loc) => !cacheRef.current.has(coordKey(loc.latitude, loc.longitude)));
      for (const loc of pending) {
        if (!isMountedRef.current) return;
        const key = coordKey(loc.latitude, loc.longitude);
        cacheRef.current.add(key);
        try {
          const address = await reverseGeocode(loc.latitude, loc.longitude);
          if (isMountedRef.current) setAddresses((prev) => ({ ...prev, [key]: address }));
        } catch {
          if (isMountedRef.current) setAddresses((prev) => ({ ...prev, [key]: "Unavailable" }));
        }
        // Stay under Nominatim's ~1 req/sec public usage limit.
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    loadMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on coordSignature, not the `locations` array identity
  }, [coordSignature]);

  if (locations.length === 0) return null;

  return (
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 10, overflow: "hidden" }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F3F0E8" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#5A5247", textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#5A5247", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#5A5247", textTransform: "uppercase", letterSpacing: "0.06em" }}>Exact Location</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#5A5247", textTransform: "uppercase", letterSpacing: "0.06em" }}>Coordinates</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#5A5247", textTransform: "uppercase", letterSpacing: "0.06em" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => {
              const key = coordKey(loc.latitude, loc.longitude);
              const address = addresses[key];
              return (
                <tr key={loc.user_id} style={{ borderTop: "1px solid #F0EDE4" }}>
                  <td style={{ padding: "10px 16px", color: "#19140F", fontWeight: 500 }}>{loc.name}</td>
                  <td style={{ padding: "10px 16px", color: "#5A5247" }}>{loc.email}</td>
                  <td style={{ padding: "10px 16px", color: "#5A5247", maxWidth: 320 }}>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} style={{ color: "#9B9188", flexShrink: 0, marginTop: 2 }} />
                      <span>{address ?? "Locating..."}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#9B9188", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#9B9188", whiteSpace: "nowrap" }}>
                    {new Date(loc.updated_at).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
