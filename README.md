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

## Accounts and sign-in

Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/account` (customers) and `/professional/login`, `/professional/signup`, `/professional/onboarding`, `/professional/dashboard` (professionals).

- Roles (`customer`, `professional`, `admin`) live in `public.profiles` and are checked on the server. People cannot change their own role. Sign-up can only create customers or professionals.
- A professional's registration starts as `submitted`. Only an admin can change the status, so no one gets a verified badge automatically. To make an admin, change `role` for that user in the Supabase table editor.
- Uploads go to the private `professional-uploads` bucket (5 MB, JPG/PNG/WebP/PDF), one folder per user.
- Sign-in is by **email and password**. Phone numbers are collected and saved, but signing in with a phone number needs an SMS provider, which isn't set up.

### Supabase dashboard settings (Authentication)

1. **URL Configuration**: Site URL `http://localhost:3000` (your real domain later). Add redirect URL `http://localhost:3000/auth/callback` (and the live one).
2. **Email**: with "Confirm email" on, Supabase's built-in sender is heavily rate limited and meant for testing. For launch, set up your own SMTP. While developing you can switch "Confirm email" off so sign-up signs you straight in.
3. Optional: raise the minimum password length under Authentication > Sign In / Providers > Email.

The old `professional_applications` tables are no longer used by the site and can be dropped later.
