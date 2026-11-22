import { CarIcon, CheckIcon, PhoneIcon, PinIcon, ScissorsIcon, WrenchIcon } from "./icons";

const orbit = [
  { Icon: WrenchIcon, label: "Home services", pos: "left-[0%] top-[8%]", delay: "0.5s" },
  { Icon: PhoneIcon, label: "Electronics", pos: "right-[0%] top-[14%]", delay: "0.62s" },
  { Icon: ScissorsIcon, label: "Grooming", pos: "left-[3%] bottom-[8%]", delay: "0.74s" },
  { Icon: CarIcon, label: "Automotive", pos: "right-[3%] bottom-[4%]", delay: "0.86s" },
];

// A sample request, the way a customer would fill one in. The details are made up for
// illustration and the card says so. No people, prices or ratings.
export default function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md"
      role="img"
      aria-label="A sample service request for a leaking kitchen tap in Ahodwo, surrounded by icons for home services, electronics, grooming and automotive"
    >
      <div className="absolute inset-[6%] rounded-full bg-gold" />
      <div className="absolute inset-[22%] rounded-full border-2 border-ink/15" />

      <div
        className="hero-rise absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] rounded-2xl bg-white p-4 text-ink shadow-[0_30px_60px_-20px_rgba(0,29,87,0.55)] sm:p-5"
        style={{ animationDelay: "0.25s" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-bold">New request</p>
          <span className="rounded bg-ink/[0.07] px-2 py-0.5 text-[11px] font-semibold text-slate">Sample</span>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-sand px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-paper">
            <WrenchIcon width={18} height={18} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-bold sm:text-sm">Leaking kitchen tap</span>
            <span className="block truncate text-xs text-slate">Plumbing</span>
          </span>
        </div>

        <dl className="mt-3 space-y-1.5 text-xs sm:text-[13px]">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Where</dt>
            <PinIcon width={14} height={14} className="shrink-0 text-slate" />
            <dd className="truncate">Ahodwo, Kumasi</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 text-slate">When</dt>
            <dd>Saturday morning</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 text-slate">Details</dt>
            <dd className="leading-snug">Drips all night. Need it fixed before the weekend.</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate">
          <span aria-hidden="true" className="h-9 w-9 rounded-md bg-gradient-to-br from-ink/25 to-ink/10" />
          <span aria-hidden="true" className="h-9 w-9 rounded-md bg-gradient-to-br from-ink/15 to-ink/5" />
          <span>2 photos</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs font-semibold text-ink sm:text-[13px]">
          <CheckIcon width={16} height={16} className="text-gold-deep" />
          Request sent
        </div>
      </div>

      {orbit.map(({ Icon, label, pos, delay }) => (
        <span
          key={label}
          title={label}
          className={`orbit-pop absolute ${pos} grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink shadow-lg ring-1 ring-ink/10 sm:h-16 sm:w-16`}
          style={{ animationDelay: delay }}
        >
          <Icon width={28} height={28} />
        </span>
      ))}
    </div>
  );
}
