"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Circle, LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";
import type { Area } from "@/data/areas";
import { NEAR_KM, nearestAreas } from "@/lib/geo";
import { locate } from "@/lib/locate";

// Centre of Greater Accra, Ashanti and Central, so all three regions are in view.
const START: [number, number] = [6.1, -1.3];

// A map where the customer places a pin: press "Show my location" (phones are
// accurate, laptops are rough), or tap the map or drag the pin to the exact spot.
// The position is only used on this screen. It is not sent or saved anywhere.
export default function LocationMap({ areas = [] }: { areas?: Area[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const pin = useRef<Marker | null>(null);
  const ring = useRef<Circle | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const areasRef = useRef(areas);
  const stop = useRef<() => void>(() => {});
  const [status, setStatus] = useState("");
  const [choices, setChoices] = useState<Area[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    areasRef.current = areas;
  }, [areas]);

  function describe(at: [number, number], accuracy?: number) {
    const near = nearestAreas(at, areasRef.current, 3).filter((n) => n.km <= NEAR_KM);
    setChoices(near.map((n) => n.area));
    const rough = accuracy != null && accuracy > 1000;
    const where = near[0] ? ` Nearest area: ${near[0].area.name}, ${near[0].area.region}.` : areasRef.current.length ? " This spot is outside the regions we cover for now." : "";
    setStatus(
      (rough ? `Your device only gave an approximate location (within about ${(accuracy / 1000).toFixed(1)} km). Tap the map or drag the pin to your exact spot.` : "Pin placed. Drag it or tap the map to adjust.") + where,
    );
  }

  function place(at: [number, number], accuracy?: number, zoom?: number) {
    const L = lib.current;
    const m = map.current;
    if (!L || !m) return;
    if (!pin.current) {
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:26px;height:26px;border-radius:50%;background:#1a1a1a;border:4px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      pin.current = L.marker(at, { draggable: true, icon, keyboard: true, title: "Your location. Drag to adjust." }).addTo(m);
      pin.current.on("dragend", () => {
        const p = pin.current?.getLatLng();
        if (!p) return;
        ring.current?.remove();
        ring.current = null;
        describe([p.lat, p.lng]);
      });
    } else {
      pin.current.setLatLng(at);
    }
    ring.current?.remove();
    ring.current = null;
    if (accuracy != null && accuracy > 30) {
      ring.current = L.circle(at, { radius: accuracy, color: "#9a7410", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(m);
    }
    m.setView(at, zoom ?? Math.max(m.getZoom(), accuracy != null && accuracy > 1000 ? 13 : 16));
  }

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = await import("leaflet");
      if (dead || !el.current || map.current) return;
      lib.current = L;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView(START, 8);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      m.on("click", (e: LeafletMouseEvent) => {
        stop.current();
        setBusy(false);
        const at: [number, number] = [e.latlng.lat, e.latlng.lng];
        place(at, undefined, m.getZoom());
        describe(at);
      });
      map.current = m;
    })();
    return () => {
      dead = true;
      stop.current();
      map.current?.remove();
      map.current = null;
      pin.current = null;
      ring.current = null;
    };
    // place/describe only use refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function find() {
    stop.current();
    setBusy(true);
    setChoices([]);
    setStatus("Finding your location. This can take a few seconds…");
    stop.current = locate({
      onUpdate: (fix) => place([fix.lat, fix.lng], fix.accuracy),
      onDone: (fix) => {
        place([fix.lat, fix.lng], fix.accuracy);
        describe([fix.lat, fix.lng], fix.accuracy);
        setBusy(false);
      },
      onError: (message) => {
        setStatus(message + " You can also tap the map to place your pin.");
        setBusy(false);
      },
    });
  }

  return (
    <div>
      <div ref={el} role="region" aria-label="Map of Greater Accra, Ashanti and Central regions. Tap the map to place your pin." className="z-0 h-72 w-full rounded-md border border-line bg-sand sm:h-96" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={find} disabled={busy} className="rounded-md bg-gold px-5 py-3 font-bold hover:bg-gold-deep disabled:opacity-60">
          {busy ? "Finding you…" : "Show my location"}
        </button>
        <p className="min-w-0 flex-1 text-sm text-slate" role="status">{status || "Press the button, or tap the map to place your pin. We don't save it."}</p>
      </div>
      {choices.length > 1 && (
        <p className="mt-2 text-sm text-slate">Other areas close by: {choices.slice(1).map((a) => a.name).join(", ")}.</p>
      )}
    </div>
  );
}
