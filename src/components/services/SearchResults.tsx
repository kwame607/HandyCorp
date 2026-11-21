import Link from "next/link";
import { serviceHref, type Category } from "@/data/services";
import { searchCatalog } from "@/lib/service-search";
import { ArrowIcon } from "../icons";

export default function SearchResults({
  all,
  query,
  location,
}: {
  all: Category[];
  query: string;
  location: string;
}) {
  const { services, categories } = searchCatalog(all, query);

  return (
    <section
      aria-labelledby="results-heading"
      className="mt-10 border-t border-line pt-8"
    >
      <h2 id="results-heading" className="font-display text-xl font-bold md:text-2xl">
        Results for &ldquo;{query}&rdquo;
        {location && <span className="font-medium text-slate"> near {location}</span>}
      </h2>

      {services.length === 0 && categories.length === 0 ? (
        <p className="mt-4 max-w-xl leading-relaxed text-slate">
          No services match &ldquo;{query}&rdquo;. Check the spelling, try a
          simpler word such as &ldquo;plumber&rdquo; or &ldquo;phone&rdquo;, or
          browse the categories below.
        </p>
      ) : (
        <>
          {services.length > 0 && (
            <ul className="mt-5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
              {services.map(({ category, service }) => (
                <li key={service.slug}>
                  <Link
                    href={serviceHref(category.slug, service.slug, location)}
                    className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-sand/60"
                  >
                    <span>
                      <span className="block font-semibold">{service.name}</span>
                      <span className="block text-sm text-slate">{category.name}</span>
                    </span>
                    <ArrowIcon width={18} height={18} className="shrink-0 text-slate" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {categories.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/services/${category.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-ink px-4 py-2.5 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-paper"
                  >
                    Browse all {category.name}
                    <ArrowIcon width={16} height={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
