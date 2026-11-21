import Link from "next/link";
import { categories } from "@/data/services";
import CategoryIcon from "./CategoryIcon";
import {
  ArrowIcon,
  ChatIcon,
  CheckIcon,
  ProfileIcon,
  QuoteIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
} from "./icons";

export function PopularServices() {
  return (
    <section id="services" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Popular services
          </h2>
          <Link
            href="/services"
            className="hidden items-center gap-2 font-semibold underline decoration-gold decoration-2 underline-offset-8 hover:decoration-ink sm:inline-flex"
          >
            Explore all services
            <ArrowIcon width={18} height={18} />
          </Link>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ name, summary, slug }) => (
            <li key={slug}>
              <Link
                href={`/services/${slug}`}
                className="group flex h-full min-h-56 flex-col justify-between rounded-3xl bg-sand p-6 transition-colors hover:bg-ink hover:text-paper"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink transition-colors group-hover:bg-gold">
                  <CategoryIcon slug={slug} width={28} height={28} />
                </span>
                <span>
                  <span className="block font-display text-xl font-bold leading-tight">
                    {name}
                  </span>
                  <span className="mt-2 block text-[15px] text-slate transition-colors group-hover:text-paper/70">
                    {summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/services"
          className="mt-8 inline-flex items-center gap-2 font-semibold underline decoration-gold decoration-2 underline-offset-8 sm:hidden"
        >
          Explore all services
          <ArrowIcon width={18} height={18} />
        </Link>
      </div>
    </section>
  );
}

const steps = [
  {
    Icon: SearchIcon,
    title: "Find a professional",
    text: "Search by service and area. Compare profiles, work samples and reviews.",
  },
  {
    Icon: ChatIcon,
    title: "Discuss the job and agree on the price",
    text: "Message one professional or ask several for quotes. If a visit is needed to price the job, you approve the fee first, and it's credited if you hire them.",
  },
  {
    Icon: CheckIcon,
    title: "Get the job done",
    text: "Confirm the booking, follow the job's progress and review the work when it's finished.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-white py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight md:text-5xl">
          How HandyCorp works
        </h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gold text-ink">
                  <Icon width={30} height={30} />
                </span>
                <span
                  className="font-display text-5xl font-extrabold text-ink/15"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold leading-snug">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-3 max-w-sm leading-relaxed text-slate">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const trust = [
  {
    Icon: ProfileIcon,
    title: "Professional profiles",
    text: "See the services offered, areas covered and examples of past work before you get in touch.",
  },
  {
    Icon: StarIcon,
    title: "Ratings and reviews",
    text: "Reviews come from customers after a completed job, so you can see how others found the work.",
  },
  {
    Icon: ShieldIcon,
    title: "Verified accounts",
    text: "Professionals can submit identity details for review. A verified badge shows when that check is done.",
  },
  {
    Icon: QuoteIcon,
    title: "Clear requests and quotations",
    text: "Describe the job, then compare written quotes that separate labour and materials.",
  },
];

export function Trust() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight md:text-5xl">
          Good work starts with the right professional.
        </h2>

        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {trust.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-gold">
                <Icon width={24} height={24} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-slate">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProfessionalCTA() {
  return (
    <section id="professionals" className="scroll-mt-20 px-5 pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-paper md:px-14 md:py-20">
        <div className="relative max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Your skills deserve more opportunities.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/75">
            Connect with customers looking for the services you offer. Manage
            requests, build your reputation and grow your work.
          </p>
          <Link
            href="/professionals/join"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-bold text-ink transition-colors hover:bg-paper"
          >
            Join as a Professional
            <ArrowIcon width={20} height={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
