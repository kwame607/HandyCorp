"use client";

import { useId, useMemo, useRef, useState } from "react";

export type Option = { value: string; hint?: string };

// A text box with a suggestion list that opens on tap or focus and narrows as you type.
// Built by hand because the browser's own <datalist> list doesn't show on many phones.
export default function Combobox({
  name, value, onChange, options, placeholder, className, defaultValue, max = 8,
}: {
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  max?: number;
}) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const text = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const box = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return options.slice(0, max);
    const starts: Option[] = [];
    const has: Option[] = [];
    for (const o of options) {
      const v = o.value.toLowerCase();
      if (v.startsWith(q)) starts.push(o);
      else if (v.includes(q) || (o.hint ?? "").toLowerCase().includes(q)) has.push(o);
      if (starts.length >= max) break;
    }
    return [...starts, ...has].slice(0, max);
  }, [text, options, max]);

  function set(v: string) {
    setInner(v);
    onChange?.(v);
  }
  function pick(o: Option) {
    set(o.value);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={box}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={open && shown.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        enterKeyHint="search"
        className={className}
        style={{ outline: "none" }}
        onChange={(e) => {
          set(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, shown.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && active >= 0 && shown[active]) {
            e.preventDefault();
            pick(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && shown.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 min-w-56 overflow-y-auto rounded-lg border border-line bg-white py-1 text-left shadow-[0_12px_32px_-8px_rgba(0,29,87,0.3)]"
        >
          {shown.map((o, i) => (
            <li
              key={`${o.value}-${o.hint ?? ""}`}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              // Keep focus in the box while tapping, and choose on click so the tap
              // can't fall through to the button underneath once the list closes.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] ${i === active ? "bg-sand" : "hover:bg-sand"}`}
            >
              <span className="truncate font-medium">{o.value}</span>
              {o.hint && <span className="shrink-0 text-xs text-slate">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
