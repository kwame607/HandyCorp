import { CarIcon, PhoneIcon, ScissorsIcon, WrenchIcon } from "./icons";

const orbit = [
  { Icon: WrenchIcon, label: "Home services", pos: "left-[2%] top-[10%]", delay: "0.5s" },
  { Icon: PhoneIcon, label: "Electronics", pos: "right-[2%] top-[18%]", delay: "0.62s" },
  { Icon: ScissorsIcon, label: "Grooming", pos: "left-[6%] bottom-[10%]", delay: "0.74s" },
  { Icon: CarIcon, label: "Automotive", pos: "right-[6%] bottom-[6%]", delay: "0.86s" },
];

// An illustration of the request-to-quote flow. No people, prices or ratings:
// nothing here claims anything the platform can't back up yet.
export default function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md"
      role="img"
      aria-label="A service request card surrounded by icons for home services, electronics, grooming and automotive"
    >
      <div className="absolute inset-[6%] rounded-full bg-gold" />
      <div className="absolute inset-[22%] rounded-full border-2 border-ink/15" />

      <div
        className="hero-rise absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-20px_rgba(20,22,26,0.6)]"
        style={{ animationDelay: "0.25s" }}
      >
        <p className="font-display text-sm font-semibold text-gold">
          New request
        </p>
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          <div className="h-2.5 w-full rounded-full bg-paper/20" />
          <div className="h-2.5 w-4/5 rounded-full bg-paper/20" />
          <div className="h-2.5 w-3/5 rounded-full bg-paper/20" />
        </div>
        <div className="mt-5 flex gap-2" aria-hidden="true">
          <div className="h-12 w-12 rounded-xl bg-paper/10" />
          <div className="h-12 w-12 rounded-xl bg-paper/10" />
        </div>
        <div className="mt-5 rounded-full bg-gold py-2 text-center text-sm font-bold text-ink">
          Get quotes
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
