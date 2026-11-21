# HandyCorp

A location-based marketplace connecting customers with independent skilled professionals. Launching in Kumasi, Ghana.

## Stack

Next.js (App Router, TypeScript) and Tailwind CSS. Fonts are self-hosted via `@fontsource-variable`.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Status

Homepage only. `/services` is a placeholder; the other links (sign in, get started, about, contact, legal, join as a professional) point to routes that don't exist yet. Social links are placeholders.

## Database (Supabase)

Schema and seed data are in `supabase/migrations/` and are already applied to the HandyCorp project. To run the site locally:

```bash
cp .env.example .env.local   # then fill in the project URL and publishable key
npm run dev
```

- Catalogue tables (`service_categories`, `services`, `popular_services`, `areas`) are publicly readable.
- Application tables are private. The website can only add an application through the `submit_professional_application` function, which validates everything and ignores repeat phone numbers.
- The website uses only the publishable key. Never put the `service_role` key in this project.

## Professional applications

`/professionals/join` saves to the database only when `APPLICATIONS_ENABLED=true`. Leave it `false` until you are ready to accept real applications; the page then shows a notice and saves nothing.

The service and area lists still exist in two places: `src/data/*.ts` (used by the site) and the database (used to validate applications). Keep them in step until the site reads the catalogue from the database.
