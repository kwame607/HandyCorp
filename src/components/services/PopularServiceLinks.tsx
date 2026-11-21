import Link from "next/link";
import { findServiceBySlug, serviceHref, type Category } from "@/data/services";
import { ArrowIcon } from "../icons";

export default function PopularServiceLinks({ categories, popular }: { categories: Category[]; popular: { label: string; service: string }[] }) {
  return (
    <section
      aria-labelledby="popular-heading"
      className="border-y border-line bg-white py-14 md:py-16"
    >
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="popular-heading" className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Popular services
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-4">
          {popular.map(({ label, service }) => {
            const found = findServiceBySlug(categories, service);
            if (!found) return null;
            return (
              <li key={service}>
                <Link
                  href={serviceHref(found.category.slug, found.service.slug)}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3 font-medium transition-colors hover:border-ink"
                >
                  {label}
                  <ArrowIcon width={16} height={16} className="shrink-0 text-slate" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
