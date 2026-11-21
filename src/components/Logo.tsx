import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="HandyCorp home"
      className="inline-flex items-center gap-2.5"
    >
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl bg-gold font-display text-xl font-extrabold text-ink"
      >
        H
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          light ? "text-paper" : "text-ink"
        }`}
      >
        HandyCorp
      </span>
    </Link>
  );
}
