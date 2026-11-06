export type Pt = { latitude: number; longitude: number };

export function haversineKm(a: Pt, b: Pt): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Sum of hops; GPS jitter under 20 m is ignored so a stationary phone doesn't "walk".
export function routeKm(points: Pt[]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversineKm(points[i - 1], points[i]);
    if (d >= 0.02) km += d;
  }
  return km;
}
