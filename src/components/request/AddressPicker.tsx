"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Marker as LeafletMarker, Map as LeafletMap } from "leaflet";
import { locate } from "@/lib/locate";

export type Place = { address: string; lat: number | null; lng: number | null };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const START: [number, number] = [6.1, -1.3];

/* eslint-disable @typescript-eslint/no-explicit-any */
let gLoading: Promise<any> | null = null;
function loadGoogle(): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google);
  if (!gLoading) {
    gLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY ?? "")}&loading=async&v=weekly&region=GH`;
      s.async = true;
      s.onload = () => resolve(w.google);
      s.onerror = () => {
        gLoading = null;
        reject(new Error("Google Maps did not load"));
      };
      document.head.appendChild(s);
    });
  }
  return gLoading;
}

// Where the job is. The address box is always there. With a Google key there is
// also Google address search and a Google map; without one the free OpenStreetMap
// map is used. Tap the map or drag the pin to set the exact spot.
export default function AddressPicker({ value, onChange }: { value: Place; onChange: (p: Place) => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const searchEl = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const changeRef = useRef(onChange);
  const setPoint = useRef<(lat: number, lng: number, zoom?: number) => void>(() => {});
  const stop = useRef<() => void>(() => {});
  const [mode, setMode] = useState<"loading" | "google" | "osm">(KEY ? "loading" : "osm");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    valueRef.current = value;
    changeRef.current = onChange;
  });

  useEffect(() => {
    let dead = false;
    let cleanup = () => {};

    async function osm() {
      const L = await import("leaflet");
      if (dead || !mapEl.current) return;
      const m: LeafletMap = L.map(mapEl.current, { scrollWheelZoom: false }).setView(START, 8);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      let pin: LeafletMarker | null = null;
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:26px;height:26px;border-radius:50%;background:#001d57;border:4px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const drop = (lat: number, lng: number, zoom?: number) => {
        if (!pin) {
          pin = L.marker([lat, lng], { draggable: true, icon, title: "Job location. Drag to adjust." }).addTo(m);
          pin.on("dragend", () => {
            const p = pin!.getLatLng();
            changeRef.current({ ...valueRef.current, lat: p.lat, lng: p.lng });
          });
        } else pin.setLatLng([lat, lng]);
        m.setView([lat, lng], zoom ?? Math.max(m.getZoom(), 16));
      };
      m.on("click", (e) => {
        stop.current();
        setBusy(false);
        drop(e.latlng.lat, e.latlng.lng, m.getZoom());
        changeRef.current({ ...valueRef.current, lat: e.latlng.lat, lng: e.latlng.lng });
      });
      setPoint.current = drop;
      if (valueRef.current.lat != null && valueRef.current.lng != null) drop(valueRef.current.lat, valueRef.current.lng, 15);
      cleanup = () => m.remove();
    }

    async function google() {
      const g = await loadGoogle();
      const { Map } = await g.maps.importLibrary("maps");
      const { Marker } = await g.maps.importLibrary("marker").catch(() => ({ Marker: g.maps.Marker }));
      const places = await g.maps.importLibrary("places");
      if (dead || !mapEl.current) return;
      const m = new Map(mapEl.current, { center: { lat: START[0], lng: START[1] }, zoom: 8, streetViewControl: false, mapTypeControl: false, gestureHandling: "cooperative" });
      let pin: any = null;
      const drop = (lat: number, lng: number, zoom?: number) => {
        const pos = { lat, lng };
        if (!pin) {
          pin = new (g.maps.Marker ?? Marker)({ position: pos, map: m, draggable: true, title: "Job location. Drag to adjust." });
          pin.addListener("dragend", () => {
            const p = pin.getPosition();
            changeRef.current({ ...valueRef.current, lat: p.lat(), lng: p.lng() });
          });
        } else pin.setPosition(pos);
        m.setCenter(pos);
        m.setZoom(zoom ?? Math.max(m.getZoom() ?? 8, 16));
      };
      m.addListener("click", (e: any) => {
        stop.current();
        setBusy(false);
        drop(e.latLng.lat(), e.latLng.lng(), m.getZoom());
        changeRef.current({ ...valueRef.current, lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      setPoint.current = drop;
      if (valueRef.current.lat != null && valueRef.current.lng != null) drop(valueRef.current.lat, valueRef.current.lng, 15);

      if (searchEl.current && places.PlaceAutocompleteElement) {
        const ac = new places.PlaceAutocompleteElement({ includedRegionCodes: ["gh"] });
        const chosen = async (ev: any) => {
          const p = ev.placePrediction ? ev.placePrediction.toPlace() : ev.place;
          if (!p) return;
          await p.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
          if (!p.location) return;
          const text = [p.displayName, p.formattedAddress].filter(Boolean).join(", ");
          drop(p.location.lat(), p.location.lng(), 17);
          changeRef.current({ address: text.slice(0, 300), lat: p.location.lat(), lng: p.location.lng() });
        };
        ac.addEventListener("gmp-select", chosen);
        ac.addEventListener("gmp-placeselect", chosen);
        searchEl.current.replaceChildren(ac);
      }
      setMode("google");
      cleanup = () => {
        searchEl.current?.replaceChildren();
        g.maps.event.clearInstanceListeners(m);
      };
    }

    if (KEY) {
      google().catch(() => {
        if (dead) return;
        setMode("osm");
        setNote("Google Maps could not load, so the free map is shown instead.");
        osm();
      });
    } else osm();

    return () => {
      dead = true;
      stop.current();
      cleanup();
    };
  }, []);

  function find() {
    stop.current();
    setBusy(true);
    setNote("Finding your location. This can take a few seconds…");
    stop.current = locate({
      onUpdate: (fix) => setPoint.current(fix.lat, fix.lng),
      onDone: (fix) => {
        setPoint.current(fix.lat, fix.lng);
        onChange({ ...valueRef.current, lat: fix.lat, lng: fix.lng });
        setBusy(false);
        setNote(
          fix.accuracy > 1000
            ? "Your device gave only an approximate spot. Tap the map or drag the pin to the exact place."
            : "Pin placed. Drag it or tap the map to adjust.",
        );
      },
      onError: (message) => {
        setNote(message + " You can tap the map to place the pin instead.");
        setBusy(false);
      },
    });
  }

  return (
    <div>
      {KEY && <div ref={searchEl} className="mb-3 min-h-11" aria-label="Search for an address on Google Maps" />}
      <label className="block">
        <span className="font-semibold">Address or landmark</span>
        <input
          required
          minLength={3}
          maxLength={300}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House number, street, and a landmark nearby"
          autoComplete="street-address"
          className="mt-1 w-full rounded-md border border-ink/30 bg-white px-4 py-3 text-[16px]"
        />
      </label>
      <p className="mt-1 text-sm text-slate">Only the professional you book will see this address.</p>
      <div
        ref={mapEl}
        role="region"
        aria-label="Map. Tap to place a pin on the job location."
        className="z-0 mt-3 h-64 w-full rounded-md border border-line bg-sand sm:h-80"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={find} disabled={busy || mode === "loading"} className="rounded-md border border-ink px-4 py-2.5 font-semibold hover:bg-ink hover:text-paper disabled:opacity-60">
          {busy ? "Finding you…" : "Use my location"}
        </button>
        <p className="min-w-0 flex-1 text-sm text-slate" role="status">
          {note || (value.lat != null ? "Pin placed. Drag it to adjust." : "Tap the map to drop a pin. It is optional but helps the professional find you.")}
        </p>
      </div>
    </div>
  );
}
