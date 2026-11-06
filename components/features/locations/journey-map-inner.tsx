"use client";

import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

function Fit({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 1) map.fitBounds(L.latLngBounds(path), { padding: [30, 30] });
  }, [map, path]);
  return null;
}

export function JourneyMapInner({ path }: { path: [number, number][] }) {
  const start = path[0];
  const end = path[path.length - 1];
  return (
    <MapContainer center={end ?? [22.3511, 78.6677]} zoom={end ? 12 : 4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#fc4c02", weight: 4 }} />}
      {start && <CircleMarker center={start} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#2e9e5b", fillOpacity: 1 }} />}
      {end && path.length > 1 && <CircleMarker center={end} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#fc4c02", fillOpacity: 1 }} />}
      <Fit path={path} />
    </MapContainer>
  );
}
