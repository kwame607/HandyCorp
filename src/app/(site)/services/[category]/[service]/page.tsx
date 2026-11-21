import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Breadcrumb from "@/components/services/Breadcrumb";
import { categories, getService } from "@/data/services";

export function generateStaticParams() {
  return categories.flatMap((c) =>
    c.services.map((s) => ({ category: c.slug, service: s.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/services/[category]/[service]">,
) {
  const { category, service } = await props.params;
  const found = getService(category, service);
  return { title: found ? `${found.service.name} | HandyCorp` : "Services | HandyCorp" };
}

async function Where({
  searchParams,
}: {
  searchParams: PageProps<"/services/[category]/[service]">["searchParams"];
}) {
  const { location } = await searchParams;
  const value = (Array.isArray(location) ? location[0] : location)?.trim();
  return value ? <> near {value}</> : null;
}

export default async function ServicePage(
  props: PageProps<"/services/[category]/[service]">,
) {
  const { category: categorySlug, service: serviceSlug } = await props.params;
  const found = getService(categorySlug, serviceSlug);
  if (!found) notFound();
  const { category, service } = found;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 md:pt-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Explore Services", href: "/services" },
          { label: category.name, href: `/services/${category.slug}` },
          { label: service.name },
        ]}
      />

      <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-5xl">
        {service.name}
        <span className="font-medium text-slate">
          <Suspense>
            <Where searchParams={props.searchParams} />
          </Suspense>
        </span>
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">
        Professionals offering this service will be listed here. Provider
        search isn&apos;t built yet, so this page is a placeholder.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/services/${category.slug}`}
          className="rounded-md border border-ink px-5 py-3 font-semibold transition-colors hover:bg-ink hover:text-paper"
        >
          More in {category.name}
        </Link>
        <Link
          href="/services"
          className="rounded-md px-5 py-3 font-semibold underline decoration-gold decoration-2 underline-offset-8"
        >
          All services
        </Link>
      </div>
    </main>
  );
}
