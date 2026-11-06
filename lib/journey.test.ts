import { describe, expect, it } from "vitest";
import { haversineKm, routeKm } from "./journey";

describe("journey", () => {
  it("haversine Mumbai→Pune ≈ 120 km", () => {
    const d = haversineKm({ latitude: 19.076, longitude: 72.8777 }, { latitude: 18.5204, longitude: 73.8567 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(125);
  });
  it("routeKm ignores jitter", () => {
    const p = { latitude: 19, longitude: 72 };
    expect(routeKm([p, { latitude: 19.00005, longitude: 72 }, p])).toBe(0);
  });
});
