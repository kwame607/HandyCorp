import Link from "next/link";
import { Suspense } from "react";

// Placeholder so the homepage search and category links land somewhere.
// Replace with real provider search once the data layer exists.
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function SearchSummary({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";

  return (
    <p className="mt-4 text-lg text-slate">
      {q || location
        ? `Results for "${q || "any service"}"${location ? ` near ${location}` : ""} will appear here.`
        : "Browse all services here soon."}
    </p>
  );
}

export default function ServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Services
      </h1>
      <Suspense fallback={<p className="mt-4 text-lg text-slate">Loading…</p>}>
        <SearchSummary searchParams={searchParams} />
      </Suspense>
      <p className="mt-2 text-slate">
        Provider search isn&apos;t built yet. This page is a placeholder.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper"
      >
        Back to home
      </Link>
    </main>
  );
}
