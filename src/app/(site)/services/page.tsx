import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import Breadcrumb from "@/components/services/Breadcrumb";
import CategorySection from "@/components/services/CategorySection";
import DiscoverySteps from "@/components/services/DiscoverySteps";
import PopularServiceLinks from "@/components/services/PopularServiceLinks";
import ProfessionalPrompt from "@/components/services/ProfessionalPrompt";
import SearchResults from "@/components/services/SearchResults";
import type { Category } from "@/data/services";
import { getCatalogue } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Explore Services | HandyCorp",
  description:
    "Browse home repairs, electronics, grooming and automotive services and find skilled professionals near you in Kumasi.",
};

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

type Lists = { categories: Category[]; areas: string[] };

const searchProps = {
  variant: "directory",
  idPrefix: "services",
  servicePlaceholder: "What service are you looking for?",
  locationPlaceholder: "Enter your area or location",
  buttonLabel: "Search Services",
} as const;

// Reads the query string, so it sits inside <Suspense>. The fallback is the
// same empty search bar, so nothing jumps when the real one streams in.
async function SearchArea({
  searchParams,
  lists,
}: {
  searchParams: PageProps<"/services">["searchParams"];
  lists: Lists;
}) {
  const params = await searchParams;
  const q = first(params.q);
  const location = first(params.location);

  return (
    <>
      <SearchBox {...searchProps} {...lists} defaultService={q} defaultLocation={location} />
      {q && <SearchResults all={lists.categories} query={q} location={location} />}
    </>
  );
}

export default async function ServicesPage(props: PageProps<"/services">) {
  const { categories, areas, popular } = await getCatalogue();
  const lists = { categories, areas };
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 md:pb-14 md:pt-10">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Explore Services" }]}
        />

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
          HandyCorp Services
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Find the service you need.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">
          From everyday repairs to specialist services, discover skilled
          professionals ready to help.
        </p>

        <div className="mt-8 max-w-5xl">
          <Suspense fallback={<SearchBox {...searchProps} {...lists} />}>
            <SearchArea searchParams={props.searchParams} lists={lists} />
          </Suspense>
        </div>
      </section>

      <section
        aria-labelledby="browse-heading"
        className="border-t border-line pb-16 pt-12 md:pb-20 md:pt-14"
      >
        <div className="mx-auto max-w-6xl px-5">
          <h2 id="browse-heading" className="font-display text-3xl font-bold tracking-tight">
            Browse services
          </h2>
          <p className="mt-3 max-w-xl text-lg text-slate">
            Choose a category to find the right professional for your job.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
            {categories.map((category) => (
              <CategorySection key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <PopularServiceLinks categories={categories} popular={popular} />
      <DiscoverySteps />
      <ProfessionalPrompt />
    </main>
  );
}
