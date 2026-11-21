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

## Professional applications

`/professionals/join` validates the form on the server but does not store anything yet. Until storage is connected, the page shows a notice that applications aren't open. Set `APPLICATIONS_ENABLED=true` only once `src/app/(site)/professionals/join/actions.ts` saves to a real database.
