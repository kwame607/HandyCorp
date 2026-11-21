const steps = [
  {
    title: "Choose a service.",
    text: "Browse the available services and select what you need.",
  },
  {
    title: "Find a professional.",
    text: "Discover professionals offering that service in your area.",
  },
  {
    title: "Make your request.",
    text: "Contact a professional or submit a request to receive a quotation.",
  },
];

export default function DiscoverySteps() {
  return (
    <section aria-labelledby="steps-heading" className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="steps-heading" className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Getting help should be simple.
        </h2>

        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t-2 border-ink pt-5">
              <span className="font-display text-4xl font-bold text-ink/30" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs leading-relaxed text-slate">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
