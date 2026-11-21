"use client";

import { useState } from "react";
import { LocateIcon, PinIcon, SearchIcon } from "./icons";

// Specific services, not just categories (see proposal section 4).
const services = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "Tiler",
  "Phone repair",
  "Laptop repair",
  "TV repair",
  "Appliance repair",
  "Barber",
  "Hairstylist",
  "Makeup artist",
  "Nail technician",
  "Mechanic",
  "Auto electrician",
  "Tyre technician",
];

// Initial launch areas from the proposal; final coverage is still to be confirmed.
const areas = ["Ahodwo", "Asokwa", "Adum", "Bantama", "KNUST area"];

export default function SearchBox() {
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState("");

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("Location isn't available on this device. Type your area instead.");
      return;
    }
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation("My current location");
        setStatus("");
      },
      () => {
        setStatus("We couldn't get your location. Type your area instead.");
      },
      { timeout: 10000 },
    );
  }

  return (
    <form
      action="/services"
      method="get"
      role="search"
      className="w-full"
      aria-label="Find professionals"
    >
      <div className="flex flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_10px_40px_-12px_rgba(20,22,26,0.25)] ring-1 ring-ink/10 md:flex-row md:items-center md:rounded-full">
        <label className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 focus-within:bg-sand/60 md:rounded-full">
          <SearchIcon className="shrink-0 text-slate" />
          <span className="sr-only">Service</span>
          <input
            name="q"
            type="text"
            list="service-list"
            placeholder="What service do you need?"
            autoComplete="off"
            className="w-full bg-transparent text-base text-ink placeholder:text-slate focus:outline-none"
          />
        </label>

        <div className="hidden h-8 w-px bg-ink/10 md:block" aria-hidden="true" />

        <div className="flex flex-1 items-center gap-1 rounded-2xl pr-2 focus-within:bg-sand/60 md:rounded-full">
          <label className="flex flex-1 items-center gap-3 px-4 py-3">
            <PinIcon className="shrink-0 text-slate" />
            <span className="sr-only">Location</span>
            <input
              name="location"
              type="text"
              list="area-list"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCoords(null);
              }}
              placeholder="Enter your location"
              autoComplete="off"
              className="w-full bg-transparent text-base text-ink placeholder:text-slate focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            title="Use my current location"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/10"
          >
            <LocateIcon />
            <span className="sr-only">Use my current location</span>
          </button>
        </div>

        {coords && (
          <>
            <input type="hidden" name="lat" value={coords.lat} />
            <input type="hidden" name="lng" value={coords.lng} />
          </>
        )}

        <button
          type="submit"
          className="rounded-2xl bg-gold px-7 py-4 text-base font-bold text-ink transition-colors hover:bg-gold-deep md:rounded-full"
        >
          Find Professionals
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 px-2 text-sm text-slate"
      >
        {status || "Starting in Kumasi. Type your area or use your location."}
      </p>

      <datalist id="service-list">
        {services.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="area-list">
        {areas.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </form>
  );
}
