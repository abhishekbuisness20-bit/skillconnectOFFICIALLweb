# SkillConnect Official Website

**Discover Skills. Connect Opportunities.**

Official SkillConnect website source code. The project uses React, TypeScript, Vite, Express, Firebase, and Three.js. The original SkillConnect logo, dark navy visual identity, cyan/green accents, and 3D logo experience are preserved.

**Official domain:** https://skillconnectofficial.cloud.run  
**Founder & Developer:** Abhishek Singh

## Features

- Responsive public website with clean routes such as `/about`, `/features`, `/showcase`, `/launch`, and `/contact`.
- Founder-only CMS and Firebase Authentication integration.
- Firestore-backed published content, announcements, banners, and events.
- Contact, feedback, provider registration, and account-deletion workflows.
- Three.js / React Three Fiber brand showcase with a static fallback for reduced-motion, unsupported-WebGL, and search-crawler environments.
- Generated `robots.txt` and `sitemap.xml` endpoints, plus Google Search Console verification files.
- Optional server-side market insights endpoint requiring `GEMINI_API_KEY`.

## Requirements

- Node.js 22 or newer
- npm

## Local development

```bash
npm install
npm run dev
```

The development server runs on port `3000` by default.

## Production build and run

```bash
npm install
npm run build
npm start
```

The production server serves the Vite build and the Express API/SEO endpoints. Deploy this project to a Node.js hosting environment that supports an Express server and provides the `PORT` environment variable (for example, a correctly configured Cloud Run service). A static-only host such as GitHub Pages cannot run the Express API or dynamic SEO endpoints without a separate backend and route-rewrite configuration.

## Environment variables

- `PORT` – supplied by the hosting platform; defaults to `3000`.
- `GEMINI_API_KEY` – optional; enables the `/api/skill-insights` endpoint. Store it in the hosting provider's secret manager, never commit a real key.
- `NODE_ENV=production` – set by the production start command.

Firebase web configuration in `firebase-applet-config.json` is client-side configuration, not a private service-account key. Protect the Firebase project with appropriate Firestore/Storage rules and restrict the browser API key to the required APIs and authorized website origins in Google Cloud.

## SEO and indexing

- `public/robots.txt` allows public pages and excludes the private `/founder-cms` route.
- `public/sitemap.xml` lists the public canonical URLs. The Vite build and Express server also generate the sitemap from the public route registry in `src/utils/seoRouting.ts`.
- Google Search Console verification files are kept in `public/`.
- Public route titles, descriptions, canonical URLs, Open Graph URLs, and breadcrumb structured data are updated by the application for the active route.
- Search crawler user agents skip Firestore realtime listeners and page-view writes. Public pages render from bundled defaults so crawler rendering does not depend on long-lived Firestore Listen channels.

After deployment, verify these URLs return successfully:

- `https://skillconnectofficial.cloud.run/robots.txt`
- `https://skillconnectofficial.cloud.run/sitemap.xml`
- `https://skillconnectofficial.cloud.run/ads.txt`
- `https://skillconnectofficial.cloud.run/api/health`

Then use Google Search Console URL Inspection and request indexing for the homepage and important public pages. Indexing is controlled by Google and cannot be guaranteed by a code change alone.

## Important deployment notes

1. Keep the production domain and Firebase project unchanged unless a deliberate migration is planned.
2. Do not commit `.env` files, Gemini API keys, service-account JSON, or other private credentials.
3. Confirm the actual Google Play Store listing before publishing any live/download badge or Play Store CTA.
4. Review any existing CMS-published content in Firestore after deployment. The application now replaces retired November 2026 launch-date text in legacy CMS fields with the current neutral release-update defaults.
5. Test the production build and all critical forms on a staging deployment before replacing the live website.
