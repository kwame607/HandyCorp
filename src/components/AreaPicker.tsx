"use client";

import { useId, useState } from "react";
import { regions, type Area } from "@/data/areas";

// A searchable list of areas, filtered by region, with checkboxes.
// Values are area slugs. Works inside a normal <form> (one "name" value per
// ticked area) or controlled through selected/onChange.
export default function AreaPicker({
  areas, name, selected, onChange, defaultSelected = [],
}: {
  areas: Area[];
  name?: string;
  selected?: string[];
  onChange?: (next: string[]) => void;
  defaultSelected?: string[];
}) {
  const [inner, setInner] = useState<string[]>(defaultSelected);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const id = useId();
  const value = selected ?? inner;
  const term = q.trim().toLowerCase();
  const present = regions.filter((r) => areas.some((a) => a.region === r));
  const shown = areas.filter((a) => (!region || a.region === region) && (!term || a.name.toLowerCase().includes(term)));
  const nameOf = (slug: string) => areas.find((a) => a.slug === slug);

  function toggle(slug: string) {
    const next = value.includes(slug) ? value.filter((x) => x !== slug) : [...value, slug];
    setInner(next);
    onChange?.(next);
  }

  const tab = (active: boolean) => `rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-ink text-paper" : "border border-ink/30 hover:bg-ink/5"}`;

  return (
    <div>
      {present.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Region">
          <button type="button" aria-pressed={region === ""} onClick={() => setRegion("")} className={tab(region === "")}>All regions</button>
          {present.map((r) => (
            <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)} className={tab(region === r)}>{r}</button>
          ))}
        </div>
      )}
      <label htmlFor={`${id}-q`} className="sr-only">Search areas</label>
      <input
        id={`${id}-q`}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search areas, for example Santasi"
        className="w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]"
      />
      <p className="mt-2 text-sm text-slate" aria-live="polite">
        {value.length === 0 ? "None chosen yet." : `${value.length} chosen.`} Showing {shown.length} of {areas.length} areas.
      </p>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Chosen areas">
          {value.map((s) => {
            const a = nameOf(s);
            return (
              <li key={s}>
                <button type="button" onClick={() => toggle(s)} className="rounded border border-ink/30 bg-white px-2.5 py-1 text-sm hover:bg-ink/5" aria-label={`Remove ${a?.name ?? s}`}>
                  {a?.name ?? s}{a && a.region !== "Ashanti" ? `, ${a.region}` : ""} <span aria-hidden="true">×</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ul className="mt-3 grid max-h-72 gap-x-8 overflow-y-auto border-y border-line sm:grid-cols-2">
        {shown.map((a) => (
          <li key={a.slug}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2">
              <input type="checkbox" checked={value.includes(a.slug)} onChange={() => toggle(a.slug)} className="h-5 w-5 accent-ink" />
              <span>{a.name}{!region && present.length > 1 && <span className="text-sm text-slate">, {a.region}</span>}</span>
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="py-3 text-slate">No area matches your search.</li>}
      </ul>
      {name && value.map((s) => <input key={s} type="hidden" name={name} value={s} />)}
    </div>
  );
}
