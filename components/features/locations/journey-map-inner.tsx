"use client";

import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// Same dot as the admin locations map.
const dotIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:var(--gs-success);border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.2)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const COLORS = ["#fc4c02", "#2563eb", "#7c3aed", "#0d9488", "#db2777", "#ca8a04"];

function Fit({ all }: { all: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (all.length > 1) map.fitBounds(L.latLngBounds(all), { padding: [30, 30] });
  }, [map, all]);
  return null;
}

export function JourneyMapInner({ paths, dots }: { paths: [number, number][][]; dots: { name: string; pos: [number, number] }[] }) {
  const all = [...paths.flat(), ...dots.map((d) => d.pos)];
  const last = all[all.length - 1];
  return (
    <MapContainer center={last ?? [22.3511, 78.6677]} zoom={last ? 12 : 4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {paths.map((path, i) => {
        const color = COLORS[i % COLORS.length];
        return (
          <span key={i}>
            {path.length > 1 && <Polyline positions={path} pathOptions={{ color, weight: 4 }} />}
            {path.length > 0 && <CircleMarker center={path[0]} radius={6} pathOptions={{ color: "#fff", weight: 2, fillColor: "#2e9e5b", fillOpacity: 1 }} />}
          </span>
        );
      })}
      {dots.map((d, i) => (
        <Marker key={i} position={d.pos} icon={dotIcon}>
          <Popup><strong>{d.name}</strong></Popup>
        </Marker>
      ))}
      <Fit all={all} />
    </MapContainer>
  );
}
