import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import ApplicationForm from "@/components/professionals/ApplicationForm";
import Breadcrumb from "@/components/services/Breadcrumb";

export const metadata: Metadata = {
  title: "Become a Professional | HandyCorp",
  description:
    "Join HandyCorp to connect with customers in Kumasi who need the services you offer.",
};

const benefits = [
  {
    title: "A profile that shows your work",
    text: "List the services you offer, the areas you cover and examples of your past work.",
  },
  {
    title: "Requests from nearby customers",
    text: "Receive job requests for your services and areas. You choose which ones to accept.",
  },
  {
    title: "Clear quotations",
    text: "Send written quotes that separate labour and materials, so the agreed price is on record.",
  },
  {
    title: "A reputation you can build",
    text: "Customers can review completed jobs, so good work is seen by the next customer.",
  },
];

const steps = [
  {
    title: "Send your application.",
    text: "Tell us your services, your areas and your experience.",
  },
  {
    title: "Verification.",
    text: "We ask for identity details and evidence of your experience. A verified badge appears on your profile only once that check is complete.",
  },
  {
    title: "Set up your profile.",
    text: "Add your services, how you price your work, your availability and photos of your work.",
  },
  {
    title: "Start receiving requests.",
    text: "Accept the jobs that suit you and send quotations.",
  },
];

// Read at request time so the notice always matches what the server action
// will actually do, even if the setting changes without a rebuild.
async function Application() {
  await connection();
  return (
    <ApplicationForm open={process.env.APPLICATIONS_ENABLED === "true"} />
  );
}

export default function JoinPage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 md:pb-16 md:pt-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Become a Professional" },
          ]}
        />

        <h1 className="mt-8 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Your skills deserve more opportunities.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">
          Connect with customers looking for the services you offer. Manage
          requests, build your reputation and grow your work.
        </p>
        <a
          href="#apply"
          className="mt-8 inline-block rounded-md bg-ink px-7 py-4 font-semibold text-paper transition-colors hover:bg-ink/85"
        >
          Apply to join
        </a>
      </section>

      <section
        aria-labelledby="benefits-heading"
        className="border-y border-line bg-white py-14 md:py-16"
      >
        <div className="mx-auto max-w-6xl px-5">
          <h2 id="benefits-heading" className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            What you can do on HandyCorp
          </h2>
          <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {benefits.map((b) => (
              <li key={b.title} className="border-t border-line pt-5">
                <h3 className="font-display text-lg font-bold">{b.title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-slate">{b.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-2xl border-l-4 border-gold pl-4 leading-relaxed">
            <strong className="font-semibold">You stay independent.</strong> You
            set your own prices, working hours and service areas, and you decide
            which requests to accept.
          </p>
        </div>
      </section>

      <section aria-labelledby="joining-heading" className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 id="joining-heading" className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            How joining works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t-2 border-ink pt-5">
                <span className="font-display text-4xl font-bold text-ink/30" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="apply"
        aria-labelledby="apply-heading"
        className="scroll-mt-20 border-t border-line pb-20 pt-14 md:pb-28 md:pt-16"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <h2 id="apply-heading" className="font-display text-3xl font-bold tracking-tight">
              Apply to join
            </h2>
            <p className="mt-3 max-w-sm leading-relaxed text-slate">
              It takes a few minutes. We&apos;re starting with selected areas of
              Kumasi.
            </p>
            <p className="mt-6 text-slate">
              Looking for a professional instead?{" "}
              <Link href="/services" className="font-medium text-ink underline decoration-gold decoration-2 underline-offset-4">
                Browse services
              </Link>
            </p>
          </div>

          <div className="rounded-lg border border-line bg-white p-6 md:p-10">
            <Suspense
              fallback={<div aria-busy="true" className="min-h-96" />}
            >
              <Application />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
