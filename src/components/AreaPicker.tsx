"use client";

import { useId, useState } from "react";

// A searchable list of areas with checkboxes. Works inside a normal <form>
// (it submits one "name" value per ticked area) or controlled via onChange.
export default function AreaPicker({
  areas, name, selected, onChange, defaultSelected = [],
}: {
  areas: string[];
  name?: string;
  selected?: string[];
  onChange?: (next: string[]) => void;
  defaultSelected?: string[];
}) {
  const [inner, setInner] = useState<string[]>(defaultSelected);
  const [q, setQ] = useState("");
  const id = useId();
  const value = selected ?? inner;
  const term = q.trim().toLowerCase();
  const shown = term ? areas.filter((a) => a.toLowerCase().includes(term)) : areas;

  function toggle(a: string) {
    const next = value.includes(a) ? value.filter((x) => x !== a) : [...value, a];
    setInner(next);
    onChange?.(next);
  }

  return (
    <div>
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
          {value.map((a) => (
            <li key={a}>
              <button type="button" onClick={() => toggle(a)} className="rounded border border-ink/30 bg-white px-2.5 py-1 text-sm hover:bg-ink/5" aria-label={`Remove ${a}`}>
                {a} <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ul className="mt-3 grid max-h-72 gap-x-8 overflow-y-auto border-y border-line sm:grid-cols-2">
        {shown.map((a) => (
          <li key={a}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2">
              <input type="checkbox" checked={value.includes(a)} onChange={() => toggle(a)} className="h-5 w-5 accent-ink" />
              {a}
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="py-3 text-slate">No area matches “{q}”.</li>}
      </ul>
      {name && value.map((a) => <input key={a} type="hidden" name={name} value={a} />)}
    </div>
  );
}
