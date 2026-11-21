"use client";

import { useState } from "react";
import { areas } from "@/data/areas";
import { categories } from "@/data/services";
import { LocateIcon, PinIcon, SearchIcon } from "./icons";

const serviceSuggestions = categories.flatMap((c) =>
  c.services.map((s) => s.name),
);


type Props = {
  /** "hero" is the rounded homepage bar; "directory" is the flatter bar used inside pages. */
  variant?: "hero" | "directory";
  servicePlaceholder?: string;
  locationPlaceholder?: string;
  buttonLabel?: string;
  defaultService?: string;
  defaultLocation?: string;
  /** Unique prefix so two search bars on one page never share datalist ids. */
  idPrefix?: string;
};

const styles = {
  hero: {
    wrap: "flex flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_10px_40px_-12px_rgba(20,22,26,0.25)] ring-1 ring-ink/10 md:flex-row md:items-center md:rounded-full",
    field: "rounded-2xl md:rounded-full",
    button: "rounded-2xl px-7 py-4 md:rounded-full",
  },
  directory: {
    wrap: "flex flex-col gap-2 rounded-lg border border-line bg-white p-2 md:flex-row md:items-center",
    field: "rounded-md",
    button: "rounded-md px-6 py-3.5",
  },
} as const;

export default function SearchBox({
  variant = "hero",
  servicePlaceholder = "What service do you need?",
  locationPlaceholder = "Enter your location",
  buttonLabel = "Find Professionals",
  defaultService = "",
  defaultLocation = "",
  idPrefix = "search",
}: Props) {
  const [location, setLocation] = useState(defaultLocation);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const s = styles[variant];
  const serviceList = `${idPrefix}-services`;
  const areaList = `${idPrefix}-areas`;

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
      aria-label="Search services"
    >
      <div className={s.wrap}>
        <label
          className={`flex flex-1 items-center gap-3 px-4 py-3 focus-within:bg-sand/60 ${s.field}`}
        >
          <SearchIcon className="shrink-0 text-slate" />
          <span className="sr-only">Service</span>
          <input
            name="q"
            type="text"
            list={serviceList}
            defaultValue={defaultService}
            placeholder={servicePlaceholder}
            autoComplete="off"
            className="w-full bg-transparent text-base text-ink placeholder:text-slate focus:outline-none"
          />
        </label>

        <div className="hidden h-8 w-px bg-ink/10 md:block" aria-hidden="true" />

        <div
          className={`flex flex-1 items-center gap-1 pr-2 focus-within:bg-sand/60 ${s.field}`}
        >
          <label className="flex flex-1 items-center gap-3 px-4 py-3">
            <PinIcon className="shrink-0 text-slate" />
            <span className="sr-only">Location</span>
            <input
              name="location"
              type="text"
              list={areaList}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCoords(null);
              }}
              placeholder={locationPlaceholder}
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
          className={`bg-gold text-base font-bold text-ink transition-colors hover:bg-gold-deep ${s.button}`}
        >
          {buttonLabel}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 px-2 text-sm text-slate"
      >
        {status || "Starting in Kumasi. Type your area or use your location."}
      </p>

      <datalist id={serviceList}>
        {serviceSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id={areaList}>
        {areas.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </form>
  );
}
