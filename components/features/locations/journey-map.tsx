"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./journey-map-inner").then((m) => m.JourneyMapInner), {
  ssr: false,
  loading: () => <div style={{ height: "100%", background: "rgba(90,82,71,0.08)" }} />,
});

export function JourneyMap({ path }: { path: [number, number][] }) {
  return <Inner path={path} />;
}
