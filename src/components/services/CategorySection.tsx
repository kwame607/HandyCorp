import Link from "next/link";
import type { Category } from "@/data/services";
import { serviceHref } from "@/data/services";
import { ArrowIcon } from "../icons";
import CategoryImage from "./CategoryImage";

export default function CategorySection({ category }: { category: Category }) {
  const headingId = `category-${category.slug}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-white"
    >
      <CategoryImage category={category} />

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 id={headingId} className="font-display text-2xl font-bold tracking-tight">
          {category.name}
        </h3>
        <p className="mt-2 max-w-md leading-relaxed text-slate">
          {category.description}
        </p>

        <ul className="mt-6 grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
          {category.services.map((service) => (
            <li key={service.slug} className="border-b border-line">
              <Link
                href={serviceHref(category.slug, service.slug)}
                className="flex min-h-11 items-center justify-between gap-2 py-2.5 text-[15px] font-medium hover:underline hover:decoration-gold hover:decoration-2 hover:underline-offset-4"
              >
                {service.name}
                <ArrowIcon width={16} height={16} className="shrink-0 text-slate" />
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={`/services/${category.slug}`}
          className="mt-7 inline-flex w-fit items-center gap-2 rounded-md border border-ink px-5 py-3 font-semibold transition-colors hover:bg-ink hover:text-paper"
        >
          Explore category
          <ArrowIcon width={18} height={18} />
        </Link>
      </div>
    </article>
  );
}
