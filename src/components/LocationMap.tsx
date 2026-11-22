"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { Area } from "@/data/areas";
import { NEAR_KM, nearestArea } from "@/lib/geo";

// Centre of Greater Accra, Ashanti and Central, so all three regions are in view.
const START: [number, number] = [6.1, -1.3];


// Shows a map of Kumasi. Only when the person presses the button do we ask the
// browser for their location. It is drawn on the map and is not sent or saved anywhere.
export default function LocationMap({ areas = [] }: { areas?: Area[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
    })();
    return () => {
      dead = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("Location isn't available on this device.");
      return;
    }
    setBusy(true);
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const L = lib.current;
        const m = map.current;
        if (L && m && layer.current) {
          const at: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          layer.current.clearLayers();
          L.circle(at, { radius: Math.max(pos.coords.accuracy, 20), color: "#9a7410", weight: 1, fillOpacity: 0.12 }).addTo(layer.current);
          L.circleMarker(at, { radius: 8, color: "#fff", weight: 3, fillColor: "#1a1a1a", fillOpacity: 1 }).bindTooltip("You are here").addTo(layer.current);
          m.setView(at, pos.coords.accuracy > 1000 ? 14 : 16);
        }
        const at: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const best = nearestArea(at, areas);
        const near = best
          ? best.km <= NEAR_KM
            ? ` Nearest area: ${best.area.name}, ${best.area.region}.`
            : " You look to be outside the regions we cover for now."
          : "";
        setStatus(`Showing your location, accurate to about ${Math.round(pos.coords.accuracy)} metres.${near}`);
        setBusy(false);
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "Location is blocked. Allow it in your browser settings, then try again." : "We couldn't find your location. Check your signal and try again.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  return (
    <div>
      <div ref={el} role="region" aria-label="Map of Greater Accra, Ashanti and Central regions" className="z-0 h-72 w-full rounded-md border border-line bg-sand sm:h-96" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={busy} className="rounded-md bg-gold px-5 py-3 font-bold hover:bg-gold-deep disabled:opacity-60">
          Show my location
        </button>
        <p className="text-sm text-slate" role="status">{status || "Only used on this screen. We don't save it."}</p>
      </div>
    </div>
  );
}
