// Single source of truth for categories and services.
// Plain data only (no React), so it can later be replaced by database queries
// that return the same shapes.

export type Service = {
  slug: string;
  name: string;
  /** Extra words people search with, e.g. "plumber" for Plumbing. */
  keywords: string[];
};

export type Category = {
  slug: string;
  name: string;
  /** One line used on compact tiles. */
  summary: string;
  description: string;
  /**
   * Optional path of a photograph under /public, e.g.
   * "/images/services/home-services.jpg". When missing, a neutral
   * placeholder panel is shown instead.
   */
  photo?: string;
  photoAlt: string;
  services: Service[];
};

export const categories: Category[] = [
  {
    slug: "home-services-repairs",
    name: "Home Services & Repairs",
    summary: "Plumbing, electrical, carpentry, painting",
    description:
      "Reliable professionals for everyday home improvements, installations and repairs.",
    photoAlt: "A tradesperson carrying out a repair in a home",
    services: [
      { slug: "plumbing", name: "Plumbing", keywords: ["plumber", "pipes", "leak", "tap", "water"] },
      { slug: "electrical-work", name: "Electrical work", keywords: ["electrician", "electrical", "wiring", "socket", "light"] },
      { slug: "carpentry", name: "Carpentry", keywords: ["carpenter", "wood", "cabinet", "door", "furniture"] },
      { slug: "painting", name: "Painting", keywords: ["painter", "paint", "walls"] },
      { slug: "masonry", name: "Masonry", keywords: ["mason", "bricklayer", "blocks", "plaster"] },
      { slug: "tiling", name: "Tiling", keywords: ["tiler", "tiles", "floor"] },
      { slug: "roofing", name: "Roofing", keywords: ["roofer", "roof", "leaking roof"] },
      { slug: "general-home-repairs", name: "General home repairs", keywords: ["handyman", "fix", "maintenance"] },
      { slug: "furniture-assembly", name: "Furniture assembly", keywords: ["assemble", "flat pack"] },
    ],
  },
  {
    slug: "electronics-technology",
    name: "Electronics & Technology",
    summary: "Phones, laptops, TVs, appliances",
    description: "Get help with your electronics, devices and everyday technology.",
    photoAlt: "A technician repairing an electronic device",
    services: [
      { slug: "mobile-phone-repairs", name: "Mobile phone repairs", keywords: ["phone", "mobile", "screen", "smartphone"] },
      { slug: "laptop-repairs", name: "Laptop repairs", keywords: ["laptop", "notebook"] },
      { slug: "computer-servicing", name: "Computer servicing", keywords: ["computer", "pc", "desktop"] },
      { slug: "television-repairs", name: "Television repairs", keywords: ["tv", "television"] },
      { slug: "home-appliance-repairs", name: "Home appliance repairs", keywords: ["appliance", "fridge", "washing machine", "cooker", "fan"] },
      { slug: "software-installation", name: "Software installation", keywords: ["software", "install", "windows"] },
      { slug: "computer-troubleshooting", name: "Computer troubleshooting", keywords: ["troubleshoot", "virus", "slow computer"] },
      { slug: "electronics-maintenance", name: "Electronics maintenance", keywords: ["electronics", "servicing"] },
    ],
  },
  {
    slug: "grooming-personal-care",
    name: "Grooming & Personal Care",
    summary: "Barbers, hairstylists, makeup, nails",
    description:
      "Find experienced professionals for your grooming and personal care needs.",
    photoAlt: "A barber at work",
    services: [
      { slug: "barbers", name: "Barbers", keywords: ["barber", "haircut", "shave", "beard"] },
      { slug: "hairstylists", name: "Hairstylists", keywords: ["hairstylist", "hair", "hair styling", "stylist", "salon"] },
      { slug: "makeup-artists", name: "Makeup artists", keywords: ["makeup", "make-up"] },
      { slug: "nail-technicians", name: "Nail technicians", keywords: ["nails", "manicure", "pedicure"] },
      { slug: "braiding", name: "Braiding", keywords: ["braids", "plaits", "cornrows"] },
      { slug: "home-grooming", name: "Home grooming", keywords: ["mobile barber", "grooming at home"] },
      { slug: "beauty-services", name: "Beauty services", keywords: ["beauty", "facial", "skin"] },
    ],
  },
  {
    slug: "automotive-services",
    name: "Automotive Services",
    summary: "Mechanics, auto electricians, tyres",
    description:
      "Find skilled automotive professionals for vehicle repairs and maintenance.",
    photoAlt: "A mechanic working on a vehicle",
    services: [
      { slug: "general-mechanics", name: "General mechanics", keywords: ["mechanic", "car repair", "car repairs", "engine"] },
      { slug: "auto-electricians", name: "Auto electricians", keywords: ["auto electrician", "car electrician", "car wiring"] },
      { slug: "vehicle-diagnostics", name: "Vehicle diagnostics", keywords: ["diagnostic", "diagnosis", "check engine"] },
      { slug: "tyre-services", name: "Tyre services", keywords: ["tyre", "tire", "wheel", "puncture"] },
      { slug: "car-servicing", name: "Car servicing", keywords: ["service", "oil change"] },
      { slug: "battery-services", name: "Battery services", keywords: ["battery", "jump start"] },
      { slug: "vehicle-maintenance", name: "Vehicle maintenance", keywords: ["maintenance", "vehicle"] },
    ],
  },
];

/** Frequently searched services. Display labels may differ from the service name. */
export const popularServices: { label: string; service: string }[] = [
  { label: "Plumbing", service: "plumbing" },
  { label: "Electrical repairs", service: "electrical-work" },
  { label: "Phone repairs", service: "mobile-phone-repairs" },
  { label: "Carpentry", service: "carpentry" },
  { label: "Hair styling", service: "hairstylists" },
  { label: "Car repairs", service: "general-mechanics" },
  { label: "Painting", service: "painting" },
  { label: "Appliance repairs", service: "home-appliance-repairs" },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getService(
  categorySlug: string,
  serviceSlug: string,
): { category: Category; service: Service } | undefined {
  const category = getCategory(categorySlug);
  const service = category?.services.find((s) => s.slug === serviceSlug);
  return category && service ? { category, service } : undefined;
}

/** Find a service by slug alone (slugs are unique across categories). */
export function findServiceBySlug(
  serviceSlug: string,
): { category: Category; service: Service } | undefined {
  for (const category of categories) {
    const service = category.services.find((s) => s.slug === serviceSlug);
    if (service) return { category, service };
  }
  return undefined;
}

export function serviceHref(
  categorySlug: string,
  serviceSlug: string,
  location?: string,
): string {
  const base = `/services/${categorySlug}/${serviceSlug}`;
  return location ? `${base}?location=${encodeURIComponent(location)}` : base;
}
