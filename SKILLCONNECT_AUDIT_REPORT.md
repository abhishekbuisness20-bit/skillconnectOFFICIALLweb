# SkillConnect Website – Technical Audit & Correction Report

**Project:** SkillConnect Official Website  
**Domain retained:** https://skillconnectofficial.cloud.run  
**Audit date:** 23 November 2026  
**Scope:** Source-level corrections only. No live deployment, Firebase project migration, domain change, or Google Search Console changes were performed.

## Main findings

1. **Conflicting sitemap copies:** the repository root and `public/` contained different sitemap contents and `lastmod` values. They have been synchronized to the same public route list.
2. **Firestore crawler requests:** the public CMS opened four Firestore `onSnapshot` Listen channels for every visitor, including search crawlers. The automatic Firestore connection probe also ran at module initialization. Search crawler user agents now use bundled public defaults and skip realtime listeners/page-view writes; the unconditional connection probe was removed.
3. **False Play Store availability claims:** the UI treated the passage of the target launch date as proof that the Android app was live. This could show a Play Store download button without checking the actual listing. Calendar-based live claims and countdowns were removed and replaced with neutral release-update messaging.
4. **Retired launch-date copy:** older November 2026 date references appeared in the site, CMS defaults, static HTML, and feature labels. Defaults and legacy CMS display handling were updated to avoid presenting those dates as current release promises.
5. **3D rendering for crawlers:** the 3D logo scene now uses its static original-logo fallback for known search crawler user agents. Normal visitors retain the existing 3D scene; reduced-motion and unsupported-WebGL fallbacks remain.
6. **Deployment documentation:** README instructions described GitHub Pages/static hosting even though the project contains an Express server, API endpoint, and dynamic SEO endpoints. README now describes the Node/Express production workflow and explains the static-host limitation.

## Corrections applied

- Synchronized `sitemap.xml` and `public/sitemap.xml`; both list the public routes and use the official `skillconnectofficial.cloud.run` domain.
- Preserved `robots.txt` rules for public pages and the private `/founder-cms` route. No rule was added to block Googlebot from the website itself.
- Kept the existing canonical URL and dynamic route metadata behavior.
- Prevented search crawlers from opening public Firestore realtime Listen channels and recording page-view writes.
- Removed the automatic Firestore connectivity request on every page load.
- Replaced date-triggered Play Store/live status claims with neutral availability messaging.
- Updated old feature-status labels and default FAQ/SEO copy.
- Added legacy CMS handling for retired November 2026 date text in homepage labels, contact copy, SEO metadata, FAQs, service labels, banners, announcements, and promotional ribbon text.
- Kept the original SkillConnect logo assets, website styling, and regular visitor 3D experience.
- Updated the README for Express/Node deployment and security notes.
- Renamed the package from `react-example` to `skillconnect-official-website`.

## Important items not changed

- **Firebase project and domain:** left unchanged.
- **Firebase web API key:** this is client-side Firebase configuration, not a service-account secret. Restrict it in Google Cloud to the required APIs and authorized website origins. Do not expose service-account keys or Gemini API keys.
- **Firestore security rules:** not rewritten because changing them without testing could break CMS, registration, feedback, or analytics. The `/site_analytics/traffic` rule currently permits public counter writes; this can be abused to inflate analytics. Consider moving counter updates behind a trusted backend or adding Firebase App Check and abuse controls.
- **Three.js `THREE.Clock` warning:** the project source does not directly instantiate `THREE.Clock`; the warning appears to originate in the Three.js/React Three Fiber dependency path. Dependency upgrades were not attempted because they could break the 3D experience. The Google crawler path now avoids mounting the WebGL canvas.
- **Google Ads / DoubleClick resources:** requests blocked by the advertising domains' robots rules are third-party ad resources, not evidence that the SkillConnect site itself is disallowed from indexing. Do not loosen the site's robots rules to fix those external requests.

## Validation performed

- Parsed all project JSON files successfully.
- Parsed both sitemap XML files successfully.
- Confirmed the two sitemap copies match.
- TypeScript/TSX syntax transpilation check: **34 files, 0 syntax diagnostics**.
- Reviewed the crawler Firestore listener path and date-based release logic.

## Validation not completed

The dependency installation command timed out in this environment, and the ZIP did not contain `node_modules`. Therefore a full Vite production build and semantic TypeScript check could not be completed here. Run the commands below on your development machine before deployment:

```bash
npm install
npm run lint
npm run build
npm start
```

Do not deploy if `npm run lint` or `npm run build` reports errors.

## After deployment

1. Confirm the homepage, `/robots.txt`, `/sitemap.xml`, `/ads.txt`, and `/api/health` return successfully.
2. Open the site in a normal browser and verify navigation, forms, CMS login, Firebase writes, and the 3D logo.
3. Use Google Search Console → URL Inspection → Test Live URL.
4. Inspect the failed resources list again. Google Ads/DoubleClick blocked requests may remain expected third-party warnings; check whether the Firestore Listen errors have disappeared.
5. Submit the sitemap and request indexing for the homepage and important public pages. Google controls final indexing and timing.
6. Confirm the real Play Store listing before adding any public Play Store download button or “live” badge.
