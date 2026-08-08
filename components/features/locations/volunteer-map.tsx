"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface VolunteerLocation {
  user_id: string;
  name?: string;
  email?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
}

// Colored dot instead of the default Leaflet marker image, which needs
// asset-path workarounds under webpack/Next.js.
const dotIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:var(--gs-success);border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.2)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function VolunteerMap({ locations }: { locations: VolunteerLocation[] }) {
  const center: [number, number] =
    locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [22.3511, 78.6677]; // India centroid fallback

  return (
    <MapContainer center={center} zoom={locations.length > 0 ? 6 : 4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.user_id} position={[loc.latitude, loc.longitude]} icon={dotIcon}>
          <Popup>
            <div style={{ fontSize: 13 }}>
              <strong>{loc.name}</strong>
              <br />
              {loc.email}
              <br />
              Updated: {new Date(loc.updated_at).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
