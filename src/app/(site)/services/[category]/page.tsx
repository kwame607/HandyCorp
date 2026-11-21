import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/services/Breadcrumb";
import { ArrowIcon } from "@/components/icons";
import { categories, getCategory, serviceHref } from "@/data/services";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[category]">) {
  const { category } = await props.params;
  const found = getCategory(category);
  return { title: found ? `${found.name} | HandyCorp` : "Services | HandyCorp" };
}

export default async function CategoryPage(props: PageProps<"/services/[category]">) {
  const { category: slug } = await props.params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 md:pt-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Explore Services", href: "/services" },
          { label: category.name },
        ]}
      />

      <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-5xl">
        {category.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">
        {category.description}
      </p>

      <ul className="mt-10 grid border-t border-line md:grid-cols-2 md:gap-x-10 lg:grid-cols-3">
        {category.services.map((service) => (
          <li key={service.slug} className="border-b border-line">
            <Link
              href={serviceHref(category.slug, service.slug)}
              className="flex min-h-14 items-center justify-between gap-3 py-3 text-lg font-medium hover:underline hover:decoration-gold hover:decoration-2 hover:underline-offset-4"
            >
              {service.name}
              <ArrowIcon width={18} height={18} className="shrink-0 text-slate" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-slate">
        Professional listings for each service are coming soon.
      </p>
    </main>
  );
}
