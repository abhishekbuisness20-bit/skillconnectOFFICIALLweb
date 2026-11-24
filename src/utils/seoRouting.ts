export type AppRoute =
  | '/'
  | '/about'
  | '/features'
  | '/services'
  | '/showcase'
  | '/launch'
  | '/feedback'
  | '/contact'
  | '/privacy'
  | '/terms'
  | '/disclaimer'
  | '/deletion'
  | '/workspace'
  | '/founder-cms';

export interface RouteSEOConfig {
  path: AppRoute;
  title: string;
  description: string;
  breadcrumbLabel: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
  noindex?: boolean;
}

export const SITE_DOMAIN = 'https://skillconnectofficial.cloud.run';

export const ROUTE_CONFIGS: Record<AppRoute, RouteSEOConfig> = {
  '/': {
    path: '/',
    title: 'SkillConnect Official – Skill Services Marketplace India',
    description:
      'SkillConnect Official connects customers, verified service providers, and companies across India for skill exchange, mentorship, and freelance services.',
    breadcrumbLabel: 'SkillConnect Official',
    changefreq: 'daily',
    priority: '1.0',
  },
  '/about': {
    path: '/about',
    title: 'About Us & Leadership | SkillConnect Official India',
    description:
      'Learn about SkillConnect Official, founded and developed by Abhishek Singh alongside Administration Members Abhay Singh, Adarsh Singh, and Abhay Bharti.',
    breadcrumbLabel: 'About Us & Leadership',
    changefreq: 'weekly',
    priority: '0.8',
  },
  '/features': {
    path: '/features',
    title: 'Verified Features & Services | SkillConnect Official',
    description:
      'Explore SkillConnect peer-to-peer skill exchange, cryptographic skill badges, verified portfolios, and 1-on-1 mentorship channels across India.',
    breadcrumbLabel: 'Verified Features & Services',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/services': {
    path: '/services',
    title: 'Skill-Based Services Marketplace | SkillConnect Official',
    description:
      'Discover trusted professionals across India or pre-register as a verified service provider on SkillConnect Official.',
    breadcrumbLabel: 'Skill-Based Services Marketplace',
    changefreq: 'weekly',
    priority: '0.9',
  },
  '/showcase': {
    path: '/showcase',
    title: 'Mobile App Showcase | SkillConnect Official India',
    description:
      'Preview the SkillConnect mobile application interface for skill exchange, verified provider discovery, and direct mentorship across India.',
    breadcrumbLabel: 'Mobile App Showcase',
    changefreq: 'weekly',
    priority: '0.8',
  },
  '/launch': {
    path: '/launch',
    title: 'Launch Information & Roadmap | SkillConnect Official',
    description:
      'Track official SkillConnect platform milestones, release updates, and upcoming community events across India.',
    breadcrumbLabel: 'Launch Information & Roadmap',
    changefreq: 'weekly',
    priority: '0.7',
  },
  '/feedback': {
    path: '/feedback',
    title: 'Community Feedback & Reviews | SkillConnect Official',
    description:
      'Read verified early tester feedback and submit your community review to help shape SkillConnect Official across India.',
    breadcrumbLabel: 'Community Feedback & Reviews',
    changefreq: 'weekly',
    priority: '0.7',
  },
  '/contact': {
    path: '/contact',
    title: 'Contact Us & Inquiries | SkillConnect Official',
    description:
      'Send direct business, customer, or partnership inquiries to Founder Abhishek Singh and the SkillConnect Official team.',
    breadcrumbLabel: 'Contact Us & Inquiries',
    changefreq: 'monthly',
    priority: '0.7',
  },
  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy (GDPR / DPDP) | SkillConnect Official',
    description:
      'Read how SkillConnect Official protects personal data under India DPDP Act 2023 and GDPR privacy standards.',
    breadcrumbLabel: 'Privacy Policy (GDPR / DPDP)',
    changefreq: 'monthly',
    priority: '0.4',
  },
  '/terms': {
    path: '/terms',
    title: 'Terms & Conditions | SkillConnect Official',
    description:
      'Review the Terms & Conditions governing customers, service providers, and visitors using SkillConnect Official.',
    breadcrumbLabel: 'Terms & Conditions',
    changefreq: 'monthly',
    priority: '0.4',
  },
  '/disclaimer': {
    path: '/disclaimer',
    title: 'Platform Disclaimer | SkillConnect Official',
    description:
      'Read the independent marketplace disclaimer for SkillConnect Official services, listings, and third-party interactions.',
    breadcrumbLabel: 'Platform Disclaimer',
    changefreq: 'monthly',
    priority: '0.4',
  },
  '/deletion': {
    path: '/deletion',
    title: 'Account & Data Deletion Protocol | SkillConnect Official',
    description:
      'Request complete account and personal data erasure from SkillConnect Official or manage your profile records.',
    breadcrumbLabel: 'Account & Data Deletion Protocol',
    changefreq: 'monthly',
    priority: '0.4',
  },
  '/workspace': {
    path: '/workspace',
    title: 'Member Workspace | SkillConnect Official',
    description:
      'Manage your SkillConnect member profile, peer-to-peer skill exchange proposals, and saved India market briefs.',
    breadcrumbLabel: 'Member Workspace',
    changefreq: 'monthly',
    priority: '0.2',
    noindex: true,
  },
  '/founder-cms': {
    path: '/founder-cms',
    title: 'Founder CMS Console | SkillConnect Official',
    description: 'Private Founder content management and moderation workspace for SkillConnect Official.',
    breadcrumbLabel: 'Founder CMS Console',
    changefreq: 'monthly',
    priority: '0.1',
    noindex: true,
  },
};

export const PUBLIC_ROUTES: RouteSEOConfig[] = Object.values(ROUTE_CONFIGS).filter((r) => !r.noindex);

export function normalizePath(pathname: string): AppRoute {
  const cleaned = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (cleaned in ROUTE_CONFIGS) {
    return cleaned as AppRoute;
  }
  return '/';
}

export function isSearchCrawler(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver|applebot|adsbot-google|mediapartners-google|google-inspectiontool|storebot-google/i.test(
    ua
  );
}

export function syncRouteMetadata(route: AppRoute, customTitle?: string, customDescription?: string): void {
  if (typeof document === 'undefined') return;
  const cfg = ROUTE_CONFIGS[route] || ROUTE_CONFIGS['/'];
  const title = route === '/' && customTitle ? customTitle : cfg.title;
  const description = route === '/' && customDescription ? customDescription : cfg.description;
  const canonicalUrl = route === '/' ? `${SITE_DOMAIN}/` : `${SITE_DOMAIN}${route}`;

  document.title = title;

  const setMeta = (selector: string, content: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  };

  setMeta('meta[name="title"]', title);
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:url"]', canonicalUrl);

  const robotsDirective = cfg.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  setMeta('meta[name="robots"]', robotsDirective);
  setMeta('meta[name="googlebot"]', robotsDirective);
  setMeta('meta[name="bingbot"]', robotsDirective);

  if (!cfg.noindex) {
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonicalUrl);
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
      el.setAttribute('href', canonicalUrl);
    });

    const breadcrumbScript = document.getElementById('active-route-breadcrumb-jsonld');
    if (breadcrumbScript) {
      const items = [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'SkillConnect Official',
          item: `${SITE_DOMAIN}/`,
        },
      ];
      if (route !== '/') {
        items.push({
          '@type': 'ListItem',
          position: 2,
          name: cfg.breadcrumbLabel,
          item: canonicalUrl,
        });
      }
      breadcrumbScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: items,
      });
    }
  }
}

export function generateSitemapXml(lastmod = '2026-11-23'): string {
  const urls = PUBLIC_ROUTES.map((route) => {
    const loc = route.path === '/' ? `${SITE_DOMAIN}/` : `${SITE_DOMAIN}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
