export const steps = ["About you", "Your work", "Location", "Portfolio", "Review"];

export function Progress({ current }: { current: number }) {
  return (
    <ol aria-label="Registration progress" className="mb-8 flex gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        return (
          <li key={s} aria-current={n === current ? "step" : undefined} className="flex-1">
            <div className={`h-1.5 rounded-full ${n <= current ? "bg-gold-deep" : "bg-line"}`} />
            <p className={`mt-2 hidden text-xs sm:block ${n === current ? "font-semibold text-ink" : "text-slate"}`}>{s}</p>
          </li>
        );
      })}
    </ol>
  );
}
