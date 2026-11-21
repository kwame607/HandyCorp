import type { Category, Service } from "@/data/services";

export type ServiceHit = { category: Category; service: Service };

export type SearchResult = {
  services: ServiceHit[];
  categories: Category[];
};

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Matches a free-text query against service names, keywords and category names.
 * Every word typed must appear somewhere in the item, so "phone repair"
 * finds "Mobile phone repairs". Swap this for a database query later.
 */
export function searchCatalog(categories: Category[], query: string): SearchResult {
  const tokens = normalise(query).split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return { services: [], categories: [] };

  // Treat "repair" and "repairs" the same by matching on a trimmed stem.
  const stem = (t: string) => (t.length > 4 ? t.replace(/(es|s)$/, "") : t);
  const matches = (haystack: string) => {
    const h = normalise(haystack);
    return tokens.every((t) => h.includes(stem(t)));
  };

  const services: ServiceHit[] = [];
  const matchedCategories: Category[] = [];

  for (const category of categories) {
    if (matches(category.name)) matchedCategories.push(category);
    for (const service of category.services) {
      if (matches(`${service.name} ${service.keywords.join(" ")}`)) {
        services.push({ category, service });
      }
    }
  }

  return { services, categories: matchedCategories };
}
