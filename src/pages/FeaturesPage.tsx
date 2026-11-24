import { ArrowRight, ShieldCheck, Repeat, MessageSquare, Briefcase } from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { CMSSiteConfig } from '../types/cms';

interface FeaturesPageProps {
  siteConfig: CMSSiteConfig;
  onNavigate: (route: AppRoute) => void;
  onOpenActivityModal: (actionType: string, targetFeature: string) => void;
}

const FEATURE_SPECS = [
  {
    id: 'skill-exchange',
    icon: Repeat,
    kicker: '01. Bilateral Knowledge Trade',
    title: 'Peer-to-Peer Skill Exchange & Barter',
    description:
      'Exchange practical expertise directly with vetted peers across India. For example, a backend engineer can trade API architecture guidance for product design critiques without monetary barriers.',
    highlights: [
      'Structured skill-offer and skill-need pairing',
      'Milestone checkpoints for mutual accountability',
      'Verified completion history added to your SkillConnect record',
    ],
    ctaLabel: 'Request Skill Exchange Match',
  },
  {
    id: 'verified-badges',
    icon: ShieldCheck,
    kicker: '02. Tamper-Resistant Proof',
    title: 'Verified Service Portfolios & Skill Badges',
    description:
      'Replace unverified resume claims with concrete evidence. Providers attach live deployments, code repositories, client testimonials, and verified years of field experience.',
    highlights: [
      'Project-backed verification reviewed before activation',
      'Clear city, state, and remote service availability',
      'Designed for startups, enterprises, and household clients',
    ],
    ctaLabel: 'Explore Portfolio Verification',
  },
  {
    id: 'direct-mentorship',
    icon: MessageSquare,
    kicker: '03. Focused 1-on-1 Advisory',
    title: 'Direct Mentorship & Code Reviews',
    description:
      'Connect learners and early-career builders with experienced Indian practitioners for architecture reviews, interview preparation, and career direction.',
    highlights: [
      'Topic-scoped 1-on-1 sessions instead of noisy group chats',
      'Actionable deliverables and follow-up review notes',
      'Direct scheduling without third-party agency markups',
    ],
    ctaLabel: 'Request Mentorship Session',
  },
  {
    id: 'freelance-matching',
    icon: Briefcase,
    kicker: '04. Direct Client Collaboration',
    title: 'Freelance & Skilled Service Matching',
    description:
      'Customers submit clear project scopes and connect directly with verified Indian freelancers and regional service professionals.',
    highlights: [
      'Transparent scope and timeline alignment from day one',
      'Covers digital engineering, creative design, and local skilled trades',
      'Pan-India coverage across metro and Tier-2/Tier-3 cities',
    ],
    ctaLabel: 'Submit Project Scope',
  },
];

export function FeaturesPage({
  siteConfig,
  onNavigate,
  onOpenActivityModal,
}: FeaturesPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      <section className="space-y-5 max-w-3xl">
        <p className="text-xs font-semibold text-cyan-400">Verified Features &amp; Services</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Engineered for Real Capability, Not Vanity Metrics
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Every workflow inside SkillConnect Official is built to help Indian customers verify talent quickly and help skilled professionals turn real work into recurring opportunity.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURE_SPECS.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.id}
              className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-cyan-400">{feature.kicker}</span>
                  <Icon className="w-5 h-5 text-lime-400 shrink-0" />
                </div>
                <h2 className="text-2xl font-bold text-white">{feature.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-400 pt-2 border-t border-white/10">
                  {feature.highlights.map((pt) => (
                    <li key={pt}>· {pt}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenActivityModal('Feature Dispatch', feature.title)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors cursor-pointer"
                >
                  <span>{feature.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Live CMS Services Summary */}
      <section className="rounded-2xl border border-white/10 bg-[#090F22] p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Ready to Register Your Skills or Request a Service?</h2>
            <p className="text-sm text-slate-300 mt-1">
              {siteConfig.homepage.releaseNote}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/services')}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Register as Provider
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/showcase')}
              className="px-5 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
            >
              Platform Showcase
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
