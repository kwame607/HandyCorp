import { cacheLife, cacheTag } from "next/cache";
import { areas as fallbackAreas } from "@/data/areas";
import { categories as fallbackCategories, popularServices as fallbackPopular, type Category } from "@/data/services";
import { createAnonClient } from "@/lib/supabase";

export type Catalogue = {
  categories: Category[];
  popular: { label: string; service: string }[];
  areas: string[];
};

// The live lists of categories, services and areas, read from the database.
// Cached for a few minutes, and refreshed straight away when an admin changes them.
// If the database can't be reached, the copy that ships with the site is used instead.
export async function getCatalogue(): Promise<Catalogue> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");

  try {
    const supabase = createAnonClient();
    const [cats, svcs, pop, ar] = await Promise.all([
      supabase.from("service_categories").select("id, slug, name, summary, description, photo_path, photo_alt").order("sort_order"),
      supabase.from("services").select("category_id, slug, name, keywords").order("sort_order"),
      supabase.from("popular_services").select("label, services(slug)").order("sort_order"),
      supabase.from("areas").select("name").order("sort_order"),
    ]);
    if (cats.error || svcs.error || pop.error || ar.error) {
      throw new Error((cats.error || svcs.error || pop.error || ar.error)?.code || "query failed");
    }

    const categories: Category[] = (cats.data ?? [])
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        summary: c.summary,
        description: c.description,
        photo: c.photo_path ?? undefined,
        photoAlt: c.photo_alt,
        services: (svcs.data ?? [])
          .filter((s) => s.category_id === c.id)
          .map((s) => ({ slug: s.slug, name: s.name, keywords: s.keywords ?? [] })),
      }))
      // A category with nothing to offer yet isn't shown to the public.
      .filter((c) => c.services.length > 0);

    const live = new Set(categories.flatMap((c) => c.services.map((s) => s.slug)));
    const popular = (pop.data ?? [])
      .map((p) => ({ label: p.label, service: (Array.isArray(p.services) ? p.services[0] : p.services)?.slug ?? "" }))
      .filter((p) => live.has(p.service));

    if (categories.length === 0) throw new Error("empty catalogue");
    return { categories, popular, areas: (ar.data ?? []).map((a) => a.name) };
  } catch (e) {
    console.error("[catalogue] Using the built-in lists:", e instanceof Error ? e.message : "unknown error");
    return { categories: fallbackCategories, popular: fallbackPopular, areas: fallbackAreas };
  }
}
