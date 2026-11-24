import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { CMSBanner, CMSSiteConfig, CommunityFeedback } from '../types/cms';
import { SkillConnect3DLogo } from '../components/SkillConnect3DLogo';
import { CorporateMediaFrame } from '../components/CorporateMediaFrame';
import { ProviderRegistrationForm, SERVICE_CATEGORIES } from '../components/ProviderRegistrationForm';
import { GroundedSourceItem, useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  siteConfig: CMSSiteConfig;
  banners: CMSBanner[];
  approvedFeedback: CommunityFeedback[];
  onNavigate: (route: AppRoute) => void;
  onOpenActivityModal: (actionType: string, targetFeature: string) => void;
}

const INSIGHT_TOPICS = [
  'Full-Stack & Cloud Engineering',
  'UI/UX & Product Design',
  'Digital Marketing & Growth',
  'Trades & Local Skilled Services',
  '1-on-1 Career Mentorship',
];

const CORPORATE_PILLARS = [
  {
    index: '01',
    title: 'Pan-India Coverage',
    detail: 'Connecting customers and practitioners across Metro and Tier-2/3 cities.',
  },
  {
    index: '02',
    title: 'Manual Verification',
    detail: 'Every provider intake is reviewed for experience and verifiable project proof.',
  },
  {
    index: '03',
    title: 'Direct Engagement',
    detail: 'Zero intermediary markups between hiring companies, households, and talent.',
  },
  {
    index: '04',
    title: 'Founder Governance',
    detail: 'Operated with direct accountability by Abhishek Singh and Administration.',
  },
];

export function HomePage({
  siteConfig,
  banners,
  approvedFeedback,
  onNavigate,
  onOpenActivityModal,
}: HomePageProps) {
  const { user, signInWithGoogle, saveInsight } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState(INSIGHT_TOPICS[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [insightResult, setInsightResult] = useState<string>('');
  const [insightSources, setInsightSources] = useState<GroundedSourceItem[]>([]);
  const [insightError, setInsightError] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefSavedNote, setBriefSavedNote] = useState('');

  const scrollToProviderRegistration = () => {
    const el = document.getElementById('provider-registration');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigate('/services');
    }
  };

  const handleLoadInsight = async (topicQuery: string) => {
    const clean = topicQuery.trim();
    if (clean.length < 2) return;
    setSelectedTopic(clean);
    setInsightLoading(true);
    setInsightError('');
    setBriefSavedNote('');
    try {
      const res = await fetch('/api/skill-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not load live Google Search insight.');
      }
      setInsightResult(data.insight || '');
      setInsightSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      setInsightResult('');
      setInsightSources([]);
      setInsightError(
        err instanceof Error
          ? err.message
          : 'Unable to complete live Google Search insight lookup.'
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customQuery.trim().length >= 2) {
      void handleLoadInsight(customQuery);
    }
  };

  const handleSaveBrief = async () => {
    if (!insightResult) return;
    setSavingBrief(true);
    setBriefSavedNote('');
    try {
      if (!user) {
        const signedIn = await signInWithGoogle();
        if (!signedIn) {
          setSavingBrief(false);
          return;
        }
      }
      await saveInsight({
        queryTopic: selectedTopic,
        summaryText: insightResult,
        sources: insightSources,
      });
      setBriefSavedNote('Saved to your Member Workspace.');
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Unable to save insight.');
    } finally {
      setSavingBrief(false);
    }
  };

  return (
    <div className="space-y-24 pb-12">
      {/* 1. Authoritative Corporate Hero + Trust Bar */}
      <section className="relative pt-10 sm:pt-16 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6 py-2">
              <div className="space-y-5">
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-cyan-400">
                  {siteConfig.homepage.kicker}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-white leading-[1.08]">
                  {siteConfig.homepage.heroTitle}
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  {siteConfig.homepage.heroSubtitle}
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={scrollToProviderRegistration}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Register as Service Provider</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenActivityModal('Customer Inquiry', 'Verified Talent Discovery')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-[#090F22] text-slate-100 text-sm font-semibold hover:border-cyan-400/50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Hire Verified Talent</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onNavigate('/services')}
                    className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Explore All Marketplace Verticals →
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/workspace')}
                    className="font-medium text-lime-400 hover:text-lime-300 cursor-pointer"
                  >
                    {user ? 'Open Member Workspace & Gmail →' : 'Member Sign In, Workspace & Gmail →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Corporate Studio Visual + Interactive Brand Medallion */}
            <div className="lg:col-span-6 relative flex flex-col">
              <div className="relative flex-1 rounded-2xl border border-white/10 bg-[#090F22] overflow-hidden min-h-[340px] lg:min-h-[420px]">
                <img
                  src="/src/assets/images/company_hero_collaboration_1795498882931.jpg"
                  alt="Indian engineers, product designers, and business leads collaborating across SkillConnect"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover lg:absolute lg:inset-0"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-[#050814]/90 via-[#050814]/45 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div className="relative lg:absolute lg:inset-x-0 lg:bottom-0 p-6 flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-semibold text-cyan-400">
                      SkillConnect Official · India
                    </p>
                    <p className="text-sm font-semibold text-white leading-snug">
                      {siteConfig.homepage.releaseNote}
                    </p>
                    <p className="text-xs text-slate-300">
                      {siteConfig.homepage.promoRibbonText}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-26 h-26 rounded-full border border-white/15 bg-[#050814]/90 shrink-0 overflow-hidden">
                    <SkillConnect3DLogo compact />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Institutional Trust Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {CORPORATE_PILLARS.map((pillar) => (
              <div key={pillar.index} className="bg-[#080E21] p-6 space-y-2">
                <p className="text-xs font-mono tabular-nums text-cyan-400">
                  {pillar.index}. {pillar.title}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {pillar.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active CMS Banners (if configured by Founder) */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id || banner.title}
                className="rounded-2xl border border-cyan-500/25 bg-[#090F22] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-5">
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                  )}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-lime-400">
                      {banner.bannerType === 'event' ? 'Upcoming Event' : 'Company Announcement'}
                    </p>
                    <h2 className="text-xl font-bold text-white">{banner.title}</h2>
                    <p className="text-sm text-slate-300 max-w-2xl">{banner.subtitle}</p>
                  </div>
                </div>
                {banner.buttonText && (
                  <a
                    href={banner.buttonLink || '/services'}
                    onClick={(e) => {
                      if (banner.buttonLink?.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(banner.buttonLink as AppRoute);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    {banner.buttonText}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Company Audience Value: Enterprises/Customers vs Service Providers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 border-b border-white/10 pb-6 max-w-3xl">
          <p className="text-xs font-semibold text-cyan-400">Marketplace Participation</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Built for Organizations Seeking Proof and Specialists Delivering Craft
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/10 bg-[#090F22] overflow-hidden flex flex-col justify-between">
            <div>
              <CorporateMediaFrame
                src="/src/assets/images/enterprise_mentorship_hub_1795498884400.jpg"
                alt="Technology leaders and hiring companies conducting direct consultations"
                className="rounded-none border-x-0 border-t-0"
                aspectClassName="aspect-[16/10]"
              />
              <div className="p-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400">
                  <Users className="w-4 h-4" />
                  <span>For Customers &amp; Hiring Companies</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Engage Verified Indian Professionals Backed by Real Work
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Startups, SMEs, enterprises, and households across India use SkillConnect Official to connect directly with specialists whose portfolios, credentials, and delivery scope are vetted prior to onboarding.
                </p>
                <ul className="space-y-2 text-sm text-slate-300 pt-1">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Direct discovery across engineering, design, consulting, and regional trades</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Zero intermediary commission markups on direct project inquiries</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Book focused 1-on-1 advisory and technical architecture reviews</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="px-8 pb-8">
              <button
                type="button"
                onClick={() => onOpenActivityModal('Customer Inquiry', 'Verified Talent Discovery')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/10 transition-colors cursor-pointer"
              >
                <span>Submit Customer Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090F22] overflow-hidden flex flex-col justify-between">
            <div>
              <CorporateMediaFrame
                src="/src/assets/images/provider_field_craft_1795498884719.jpg"
                alt="Verified Indian service specialist inspecting commercial power systems"
                className="rounded-none border-x-0 border-t-0"
                aspectClassName="aspect-[16/10]"
              />
              <div className="p-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-lime-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>For Service Providers, Freelancers &amp; Mentors</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Turn Real Project Proof Into Direct Client Demand
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Whether your practice spans software architecture, product design, digital marketing, or field-certified electrical and home trades, join SkillConnect to build a trusted presence across Indian cities.
                </p>
                <ul className="space-y-2 text-sm text-slate-300 pt-1">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>Structured review based on project outcomes and verified years of practice</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>Peer-to-peer skill exchange to expand complementary capabilities</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>Direct customer and enterprise project leads without bidding races</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="px-8 pb-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToProviderRegistration}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lime-400 text-slate-950 text-sm font-semibold hover:bg-lime-300 transition-colors cursor-pointer"
              >
                <span>Pre-Register as Provider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/workspace')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>Propose Skill Exchange</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Integrated Service Provider Registration & Customer Service Directory */}
      <section
        id="provider-registration"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-lime-400">
              Onboarding &amp; Direct Marketplace Intake
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Register as a Service Provider or Request a Specialist
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Services Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <Building2 className="w-4 h-4" />
                <span>How SkillConnect Verification Works</span>
              </div>
              <ol className="space-y-4 text-sm">
                <li className="space-y-1">
                  <p className="font-semibold text-white">01. Submit Credentials &amp; City Scope</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Share your primary trade or engineering discipline, years of practice, and verifiable work links.
                  </p>
                </li>
                <li className="space-y-1">
                  <p className="font-semibold text-white">02. Administration Review</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Our verification desk reviews submissions manually prior to activating marketplace visibility.
                  </p>
                </li>
                <li className="space-y-1">
                  <p className="font-semibold text-white">03. Direct Customer &amp; Company Inquiries</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Approved professionals receive qualified project leads and peer skill-exchange opportunities.
                  </p>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-cyan-400">Need a Service Provider Today?</p>
                <h3 className="text-lg font-bold text-white">Quick Customer Inquiry by Vertical</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SERVICE_CATEGORIES.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onOpenActivityModal('Service Request', cat)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#050814] text-left text-xs sm:text-sm text-slate-200 hover:border-cyan-400/45 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{cat}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ProviderRegistrationForm idPrefix="home-sp" />
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Section (Asymmetric Editorial Bento) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-cyan-400">Services &amp; Opportunities</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Built for Transparent Skill Delivery Across India
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/features')}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore All Features</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {siteConfig.services.map((srv, idx) => (
            <article
              key={srv.id}
              className={`rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-4 flex flex-col justify-between ${
                idx === 0 ? 'md:col-span-2' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-cyan-400 font-medium">{srv.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{srv.statusLabel}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{srv.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{srv.summary}</p>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-400">{srv.outcome}</p>
                <button
                  type="button"
                  onClick={() => onOpenActivityModal('Feature Exploration', srv.title)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Request Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Google Search-Grounded India Skill Economy Brief */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#090F22] p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400">
                <Compass className="w-4 h-4" />
                <span>Live Google Search Market Intelligence</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Explore Grounded Demand Insights Across India
              </h2>
              <p className="text-sm text-slate-300">
                Select a skill vertical or search any Indian city and trade to fetch live Google Search-grounded demand briefs with verifiable source citations.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Search any skill or Indian city (e.g., Solar technician demand in Jaipur, GenAI freelance rates India)"
                className="w-full rounded-xl border border-white/15 bg-[#050814] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={insightLoading || customQuery.trim().length < 2}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {insightLoading ? 'Searching Live Web...' : 'Search Live Brief'}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {INSIGHT_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => void handleLoadInsight(topic)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTopic === topic
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-[#050814] border border-white/10 text-slate-300 hover:border-cyan-500/40'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#050814] p-5 min-h-[112px] space-y-4">
            {insightLoading ? (
              <div className="flex items-center gap-2.5 text-sm text-cyan-400 py-4">
                <Sparkles className="w-4 h-4" />
                <span>Querying live Google Search signals for “{selectedTopic}”...</span>
              </div>
            ) : insightError ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs sm:text-sm text-rose-200">
                {insightError}
              </div>
            ) : insightResult ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <p className="text-xs font-semibold text-cyan-400">{selectedTopic}</p>
                  <button
                    type="button"
                    disabled={savingBrief}
                    onClick={() => void handleSaveBrief()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-lime-400/40 text-lime-300 text-xs font-semibold hover:bg-lime-400/10 cursor-pointer disabled:opacity-60"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savingBrief ? 'Saving...' : user ? 'Save to Workspace' : 'Sign In & Save'}</span>
                  </button>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">{insightResult}</p>

                {briefSavedNote && (
                  <p className="text-xs text-lime-400 font-medium">{briefSavedNote}</p>
                )}

                {insightSources.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400">
                      Grounded Web Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {insightSources.map((src) => (
                        <a
                          key={src.uri}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-[#090F22] text-xs text-cyan-300 hover:border-cyan-400/40"
                        >
                          <span className="truncate max-w-[220px]">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 w-full py-4">
                <p className="text-sm text-slate-400">
                  Select a category above or run a custom query for <strong className="text-slate-200">{selectedTopic}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => void handleLoadInsight(selectedTopic)}
                  className="px-4 py-2 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/10 cursor-pointer whitespace-nowrap"
                >
                  Fetch Live Grounded Brief
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Proof & Community Voices + Founder Accountability */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-lime-400">Community &amp; Early Practitioners</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Feedback From Across India
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/feedback')}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Share Your Feedback</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(approvedFeedback.length > 0
            ? approvedFeedback.slice(0, 3).map((item) => ({
                id: item.id || item.testerName,
                name: item.testerName,
                role: item.role,
                city: item.city,
                quote: item.comment,
              }))
            : siteConfig.testimonials
          ).map((voice) => (
            <blockquote
              key={voice.id}
              className="rounded-2xl border border-white/10 bg-[#090F22] p-6 space-y-4 flex flex-col justify-between"
            >
              <p className="text-sm text-slate-200 leading-relaxed">“{voice.quote}”</p>
              <footer className="pt-4 border-t border-white/10 text-xs text-slate-400">
                <p className="font-semibold text-white">{voice.name}</p>
                <p>
                  {voice.role} · {voice.city}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Company Leadership Banner */}
        <div className="rounded-2xl border border-white/10 bg-[#090F22] p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-cyan-400">Corporate Leadership &amp; Trust</p>
            <h3 className="text-xl font-bold text-white">
              Founded &amp; Engineered by Abhishek Singh Alongside Dedicated Administration
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              SkillConnect Official operates with transparent leadership oversight and direct support channels for customers, enterprises, and service providers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="px-5 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
            >
              About Leadership
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <span>Contact Company Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      {siteConfig.faqs && siteConfig.faqs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Frequently Asked Questions</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              About SkillConnect Official
            </h2>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#090F22]">
            {siteConfig.faqs.map((faq) => (
              <div key={faq.id} className="p-6 space-y-2">
                <h3 className="text-base font-semibold text-white">{faq.question}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
