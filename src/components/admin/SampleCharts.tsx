"use client";

import { useState } from "react";

// Clearly labelled sample figures. Nothing here is real until payments are connected.
const series = {
  Daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], jobs: [820, 1130, 960, 1420, 1250, 1680, 740] },
  Weekly: { labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"], jobs: [6200, 7100, 6800, 8400, 7900, 9300, 8800, 10100] },
  Monthly: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], jobs: [24000, 27500, 31000, 29800, 35200, 38900] },
} as const;
type Period = keyof typeof series;
const RATE = 0.1; // sample rate only

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>("Weekly");
  const s = series[period];
  const max = Math.max(...s.jobs);
  const W = 560, H = 180, pad = 24;
  const bw = (W - pad * 2) / s.jobs.length;
  return (
    <div>
      <div role="tablist" aria-label="Time period" className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(series) as Period[]).map((p) => (
          <button key={p} role="tab" aria-selected={p === period} onClick={() => setPeriod(p)} className={`rounded-md border px-3 py-1.5 text-sm ${p === period ? "border-ink bg-ink text-paper" : "border-ink/20 hover:bg-ink/5"}`}>
            {p}
          </button>
        ))}
        <button disabled title="Available when payments are connected" className="rounded-md border border-ink/10 px-3 py-1.5 text-sm text-slate/70">Custom range</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Sample ${period.toLowerCase()} revenue chart`} className="w-full">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={pad} x2={W - pad} y1={H - t * (H - 16)} y2={H - t * (H - 16)} stroke="#E3E0D9" />
        ))}
        {s.jobs.map((v, i) => {
          const h = (v / max) * (H - 16);
          const c = h * RATE;
          const x = pad + i * bw + bw * 0.2;
          return (
            <g key={i}>
              <rect x={x} y={H - h} width={bw * 0.6} height={h} fill="#D9D5CB" />
              <rect x={x} y={H - c} width={bw * 0.6} height={c} fill="#17171B" />
              <text x={x + bw * 0.3} y={H + 16} textAnchor="middle" fontSize="11" fill="#626873">{s.labels[i]}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate">
        <span><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 bg-[#D9D5CB]" />Total value of completed jobs</span>
        <span><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 bg-ink" />Platform commission</span>
      </p>
    </div>
  );
}

const activity: [string, number][] = [
  ["New requests", 48], ["Pending bookings", 21], ["Confirmed bookings", 34], ["In-progress jobs", 17], ["Completed bookings", 126], ["Cancelled bookings", 9],
];
export function BookingActivity() {
  const max = Math.max(...activity.map((a) => a[1]));
  return (
    <ul className="space-y-3">
      {activity.map(([label, n]) => (
        <li key={label} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 text-[15px]">
          <span>{label}</span>
          <span className="h-2.5 bg-ink/10"><span className="block h-full bg-ink/70" style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums">{n}</span>
        </li>
      ))}
    </ul>
  );
}
