import type { Area } from "@/data/areas";

// Straight-line distance in kilometres between two [lat, lng] points.
export function km(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * r) / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(((b[1] - a[1]) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// The closest area that has coordinates, and how far away it is.
export function nearestArea(at: [number, number], areas: Area[]): { area: Area; km: number } | null {
  let best: { area: Area; km: number } | null = null;
  for (const area of areas) {
    if (area.lat == null || area.lng == null) continue;
    const d = km(at, [area.lat, area.lng]);
    if (!best || d < best.km) best = { area, km: d };
  }
  return best;
}

export const NEAR_KM = 25;

// The few closest areas that have coordinates, nearest first.
export function nearestAreas(at: [number, number], areas: Area[], count = 3): { area: Area; km: number }[] {
  return areas
    .filter((a) => a.lat != null && a.lng != null)
    .map((area) => ({ area, km: km(at, [area.lat as number, area.lng as number]) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}
