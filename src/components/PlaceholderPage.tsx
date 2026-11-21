import Link from "next/link";

// Clearly-labelled stand-in for pages that are not built yet.
export default function PlaceholderPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20">
      <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
      <div className="mt-4 max-w-xl space-y-3 text-lg leading-relaxed text-slate">
        {children}
      </div>
      <Link
        href="/services"
        className="mt-8 inline-block rounded-md border border-ink px-5 py-3 font-semibold transition-colors hover:bg-ink hover:text-paper"
      >
        Browse services
      </Link>
    </main>
  );
}
