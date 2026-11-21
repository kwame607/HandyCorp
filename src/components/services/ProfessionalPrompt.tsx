import Link from "next/link";

export default function ProfessionalPrompt() {
  return (
    <section className="border-y border-line bg-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:py-14">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Are you a skilled professional?
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-slate">
            Join HandyCorp, connect with customers and create more opportunities
            for your skills.
          </p>
        </div>
        <Link
          href="/professionals/join"
          className="w-fit shrink-0 rounded-md bg-ink px-6 py-3.5 font-semibold text-paper transition-colors hover:bg-ink/85"
        >
          Become a Professional
        </Link>
      </div>
    </section>
  );
}
