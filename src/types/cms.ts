export interface CMSServiceItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  outcome: string;
  statusLabel: string;
}

export interface CMSTestimonialItem {
  id: string;
  name: string;
  role: string;
  city: string;
  quote: string;
}

export interface CMSFAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface CMSSiteConfig {
  status: 'draft' | 'published';
  homepage: {
    kicker: string;
    heroTitle: string;
    heroSubtitle: string;
    primaryCtaText: string;
    secondaryCtaText: string;
    promoRibbonText: string;
    releaseNote: string;
  };
  about: {
    missionTitle: string;
    missionBody: string;
    founderQuote: string;
  };
  contact: {
    supportEmail: string;
    responseSla: string;
    officeLocation: string;
  };
  seo: {
    homeTitle: string;
    homeDescription: string;
  };
  services: CMSServiceItem[];
  testimonials: CMSTestimonialItem[];
  faqs?: CMSFAQItem[];
  updatedBy: string;
  updatedAt: unknown;
}

export interface CMSBanner {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  bannerType: 'promotional' | 'event';
  startDate: string;
  endDate: string;
  enabled: boolean;
  status: 'draft' | 'published';
  updatedAt: unknown;
}

export interface CMSAnnouncement {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'launch' | 'event' | 'alert' | 'festival';
  linkText: string;
  linkUrl: string;
  startDate: string;
  expiryDate: string;
  status: 'draft' | 'published';
  updatedAt: unknown;
}

export interface CMSEvent {
  id?: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  posterUrl: string;
  registrationLink: string;
  status: 'draft' | 'published';
  updatedAt: unknown;
}

export interface CMSRevision {
  id?: string;
  label: string;
  authorEmail: string;
  snapshotData: Record<string, unknown>;
  createdAt: unknown;
}

export interface CMSAuditLog {
  id?: string;
  action: string;
  module: string;
  summary: string;
  actorEmail: string;
  createdAt: unknown;
}

export interface ContactInquiry {
  id?: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'active' | 'suspended';
  createdAt: unknown;
}

export interface ActivityReport {
  id?: string;
  actionType: string;
  targetFeature?: string;
  customerName: string;
  customerEmail: string;
  details: string;
  status: 'new' | 'in_review' | 'contacted' | 'active' | 'suspended';
  createdAt: unknown;
}

export interface ServiceProvider {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  category: string;
  city: string;
  state: string;
  experienceYears: number;
  bio: string;
  status: 'pending_verification' | 'approved' | 'rejected' | 'active' | 'suspended';
  createdAt: unknown;
}

export interface CommunityFeedback {
  id?: string;
  testerName: string;
  role: string;
  city: string;
  category: 'trades' | 'tech' | 'mentorship' | 'general';
  rating: number;
  comment: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'suspended';
  createdAt: unknown;
}

export interface SiteTrafficStats {
  totalPageViews: number;
  uniqueSessions: number;
  lastPath?: string;
  updatedAt?: unknown;
}

const RETIRED_NOV_2026_PATTERN =
  /(8\s*nov(?:ember)?\s*2026|nov(?:ember)?\s*8,?\s*2026|launching\s*on\s*8\s*nov|live\s*on\s*google\s*play\s*store)/i;

export function sanitizeLegacyText(value: string | undefined, fallback: string): string {
  if (!value || typeof value !== 'string') return fallback;
  if (RETIRED_NOV_2026_PATTERN.test(value)) {
    return fallback;
  }
  return value;
}

export const DEFAULT_SITE_CONFIG: CMSSiteConfig = {
  status: 'published',
  homepage: {
    kicker: 'Building Skills · Connecting Opportunities Across India',
    heroTitle: 'Discover Verified Skills. Connect Real Opportunities.',
    heroSubtitle:
      'SkillConnect Official connects customers, verified service providers, freelancers, and companies across India for direct skill exchange, project delivery, and 1-on-1 mentorship.',
    primaryCtaText: 'Explore Services',
    secondaryCtaText: 'Register as Provider',
    promoRibbonText:
      'Official Android app availability updates will be published here once confirmed on Google Play.',
    releaseNote:
      'Early provider pre-registration and customer service inquiries are open across India.',
  },
  about: {
    missionTitle: 'Bridging Real Capability with Direct Opportunity in India',
    missionBody:
      'SkillConnect Official was founded and engineered by Abhishek Singh to solve a clear gap in India’s talent economy: skilled practitioners often lack verifiable project proof, while customers and companies struggle to find dependable specialists without middleman friction.',
    founderQuote:
      'Every practitioner across India deserves a verifiable digital reputation built on real work, direct client trust, and transparent mentorship.',
  },
  contact: {
    supportEmail: 'singhabhishek83072@gmail.com',
    responseSla: 'Direct Founder & Administration review within 24–48 business hours',
    officeLocation: 'India (Pan-India Remote Operations)',
  },
  seo: {
    homeTitle: 'SkillConnect Official – Skill Services Marketplace India',
    homeDescription:
      'SkillConnect Official connects customers, verified service providers, and companies across India for skill exchange, mentorship, and freelance services.',
  },
  services: [
    {
      id: 'srv-skill-exchange',
      title: '01. Peer-to-Peer Skill Exchange & Barter',
      category: 'Knowledge Exchange',
      summary:
        'Trade verified technical, creative, or operational expertise directly with fellow professionals and learners across India.',
      outcome: 'Direct bilateral skill matching without commission intermediaries.',
      statusLabel: 'Early Access Open',
    },
    {
      id: 'srv-verified-portfolios',
      title: '02. Cryptographic Skill Badges & Verified Portfolios',
      category: 'Trust & Proof',
      summary:
        'Present tamper-resistant project demonstrations, code repositories, and client-reviewed case studies in one structured profile.',
      outcome: 'Higher customer confidence and faster hiring decisions.',
      statusLabel: 'Verification Active',
    },
    {
      id: 'srv-mentorship',
      title: '03. Direct 1-on-1 Mentorship & Advisory',
      category: 'Career & Technical Guidance',
      summary:
        'Book structured code reviews, architecture critiques, portfolio audits, and career sessions with experienced Indian practitioners.',
      outcome: 'Actionable feedback tailored to Indian and global industry standards.',
      statusLabel: 'Requests Open',
    },
    {
      id: 'srv-freelance-matching',
      title: '04. Freelance & Skilled Service Matching',
      category: 'Marketplace Delivery',
      summary:
        'Connect startups, SMEs, and households with verified software engineers, designers, marketers, and regional skilled specialists.',
      outcome: 'Transparent scope alignment and direct provider communication.',
      statusLabel: 'Pre-Registration Open',
    },
  ],
  testimonials: [
    {
      id: 'test-1',
      name: 'Rohan Kulkarni',
      role: 'Full-Stack Developer',
      city: 'Pune, Maharashtra',
      quote:
        'Having real project links verified alongside peer skill exchanges makes it far easier for clients to trust independent Indian engineers.',
    },
    {
      id: 'test-2',
      name: 'Ananya Verma',
      role: 'Product Designer',
      city: 'Bengaluru, Karnataka',
      quote:
        'Direct mentorship matching without noisy social feeds lets learners focus on real portfolio critiques and tangible career outcomes.',
    },
    {
      id: 'test-3',
      name: 'Vikramaditya Nair',
      role: 'Technical Consultant',
      city: 'Kochi, Kerala',
      quote:
        'Clean onboarding for regional service providers gives serious specialists across Tier-1 and Tier-2 Indian cities equal visibility.',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'What is SkillConnect Official?',
      answer:
        'SkillConnect Official is an independent Indian skill-based services marketplace founded and engineered by Abhishek Singh that connects customers, verified service providers, and companies across India.',
    },
    {
      id: 'faq-2',
      question: 'How does SkillConnect verify service providers?',
      answer:
        'Service providers submit real experience records, city/state coverage, and portfolio proof during onboarding, which are reviewed prior to listing activation.',
    },
    {
      id: 'faq-3',
      question: 'When will the SkillConnect mobile app be available on Google Play?',
      answer:
        'Official Android app availability will be announced on this website and verified SkillConnect social channels once the Google Play Store listing is confirmed.',
    },
  ],
  updatedBy: 'Abhishek Singh',
  updatedAt: null,
};

export const DEFAULT_ANNOUNCEMENTS: CMSAnnouncement[] = [
  {
    id: 'ann-default-1',
    title: 'Provider Pre-Registration Open',
    message:
      'Skilled professionals across India can now pre-register for verification. Official Android release updates will be published here once confirmed on Google Play.',
    type: 'info',
    linkText: 'Register as Provider',
    linkUrl: '/services',
    startDate: '2026-01-01',
    expiryDate: '2027-12-31',
    status: 'published',
    updatedAt: null,
  },
];

export const DEFAULT_BANNERS: CMSBanner[] = [];

export const DEFAULT_EVENTS: CMSEvent[] = [
  {
    id: 'evt-onboarding-cohort',
    title: 'Pan-India Verified Service Provider Onboarding Cohort',
    description:
      'Open verification intake for software engineers, UI/UX designers, digital consultants, mentors, and regional skilled professionals across India.',
    eventDate: 'Ongoing Intake',
    location: 'Pan-India (Online Verification)',
    posterUrl: '/favicon.png',
    registrationLink: '/services',
    status: 'published',
    updatedAt: null,
  },
  {
    id: 'evt-community-feedback',
    title: 'Early Tester & Community Architecture Feedback Window',
    description:
      'Share workflow suggestions, trade category requests, and usability feedback directly with Founder Abhishek Singh and the Administration team.',
    eventDate: 'Open Now',
    location: 'SkillConnect Official Portal',
    posterUrl: '/favicon.png',
    registrationLink: '/feedback',
    status: 'published',
    updatedAt: null,
  },
];

export function sanitizeLegacyCMSConfig(raw: Partial<CMSSiteConfig> | null | undefined): CMSSiteConfig {
  if (!raw) return DEFAULT_SITE_CONFIG;
  return {
    status: raw.status || 'published',
    homepage: {
      kicker: sanitizeLegacyText(raw.homepage?.kicker, DEFAULT_SITE_CONFIG.homepage.kicker),
      heroTitle: sanitizeLegacyText(raw.homepage?.heroTitle, DEFAULT_SITE_CONFIG.homepage.heroTitle),
      heroSubtitle: sanitizeLegacyText(
        raw.homepage?.heroSubtitle,
        DEFAULT_SITE_CONFIG.homepage.heroSubtitle
      ),
      primaryCtaText: sanitizeLegacyText(
        raw.homepage?.primaryCtaText,
        DEFAULT_SITE_CONFIG.homepage.primaryCtaText
      ),
      secondaryCtaText: sanitizeLegacyText(
        raw.homepage?.secondaryCtaText,
        DEFAULT_SITE_CONFIG.homepage.secondaryCtaText
      ),
      promoRibbonText: sanitizeLegacyText(
        raw.homepage?.promoRibbonText,
        DEFAULT_SITE_CONFIG.homepage.promoRibbonText
      ),
      releaseNote: sanitizeLegacyText(
        raw.homepage?.releaseNote,
        DEFAULT_SITE_CONFIG.homepage.releaseNote
      ),
    },
    about: {
      missionTitle: sanitizeLegacyText(
        raw.about?.missionTitle,
        DEFAULT_SITE_CONFIG.about.missionTitle
      ),
      missionBody: sanitizeLegacyText(raw.about?.missionBody, DEFAULT_SITE_CONFIG.about.missionBody),
      founderQuote: sanitizeLegacyText(
        raw.about?.founderQuote,
        DEFAULT_SITE_CONFIG.about.founderQuote
      ),
    },
    contact: {
      supportEmail: raw.contact?.supportEmail || DEFAULT_SITE_CONFIG.contact.supportEmail,
      responseSla: sanitizeLegacyText(
        raw.contact?.responseSla,
        DEFAULT_SITE_CONFIG.contact.responseSla
      ),
      officeLocation: sanitizeLegacyText(
        raw.contact?.officeLocation,
        DEFAULT_SITE_CONFIG.contact.officeLocation
      ),
    },
    seo: {
      homeTitle: sanitizeLegacyText(raw.seo?.homeTitle, DEFAULT_SITE_CONFIG.seo.homeTitle),
      homeDescription: sanitizeLegacyText(
        raw.seo?.homeDescription,
        DEFAULT_SITE_CONFIG.seo.homeDescription
      ),
    },
    services:
      Array.isArray(raw.services) && raw.services.length > 0
        ? raw.services.map((srv, idx) => ({
            ...srv,
            title: sanitizeLegacyText(srv.title, DEFAULT_SITE_CONFIG.services[idx]?.title || srv.title),
            summary: sanitizeLegacyText(
              srv.summary,
              DEFAULT_SITE_CONFIG.services[idx]?.summary || srv.summary
            ),
            statusLabel: sanitizeLegacyText(
              srv.statusLabel,
              DEFAULT_SITE_CONFIG.services[idx]?.statusLabel || 'Open'
            ),
          }))
        : DEFAULT_SITE_CONFIG.services,
    testimonials:
      Array.isArray(raw.testimonials) && raw.testimonials.length > 0
        ? raw.testimonials
        : DEFAULT_SITE_CONFIG.testimonials,
    faqs:
      Array.isArray(raw.faqs) && raw.faqs.length > 0
        ? raw.faqs.map((faq, idx) => ({
            ...faq,
            question: sanitizeLegacyText(
              faq.question,
              DEFAULT_SITE_CONFIG.faqs?.[idx]?.question || faq.question
            ),
            answer: sanitizeLegacyText(
              faq.answer,
              DEFAULT_SITE_CONFIG.faqs?.[idx]?.answer || faq.answer
            ),
          }))
        : DEFAULT_SITE_CONFIG.faqs,
    updatedBy: raw.updatedBy || DEFAULT_SITE_CONFIG.updatedBy,
    updatedAt: raw.updatedAt ?? null,
  };
}
