import { Calendar, MapPin, ArrowRight, Bell } from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { CMSEvent, CMSSiteConfig } from '../types/cms';

interface LaunchPageProps {
  siteConfig: CMSSiteConfig;
  events: CMSEvent[];
  onNavigate: (route: AppRoute) => void;
}

const ROADMAP_MILESTONES = [
  {
    phase: 'Phase 01 · Completed',
    title: 'Official Web Portal & Verification Intake',
    detail:
      'Public web presence launched at skillconnectofficial.cloud.run with direct service inquiry workflows, community feedback intake, and Indian provider pre-registration.',
  },
  {
    phase: 'Phase 02 · Active',
    title: 'Pan-India Provider Verification & Community Feedback',
    detail:
      'Reviewing early provider registrations across engineering, design, consulting, and regional trades while refining workflows with tester feedback.',
  },
  {
    phase: 'Phase 03 · Upcoming',
    title: 'Android Release Confirmation on Google Play',
    detail:
      'Official Android application release links and badges will be published here once the Google Play Store listing is confirmed and live.',
  },
];

export function LaunchPage({ siteConfig, events, onNavigate }: LaunchPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      <section className="space-y-5 max-w-3xl">
        <p className="text-xs font-medium text-cyan-400">Launch Information &amp; Roadmap</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Transparent Platform Rollout &amp; Release Updates
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {siteConfig.homepage.promoRibbonText}
        </p>
        <div className="rounded-xl border border-cyan-500/25 bg-[#0A1024] p-5 flex items-start gap-3 text-sm text-slate-200">
          <Bell className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Android App Release Status</p>
            <p className="text-slate-300">
              We publish Play Store links only after official Google Play listing verification. Until then, customers and providers can use this official portal to register and submit inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Rollout Milestones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROADMAP_MILESTONES.map((item) => (
            <article
              key={item.phase}
              className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-3"
            >
              <p className="text-xs font-medium text-lime-400">{item.phase}</p>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Upcoming Events from CMS */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-medium text-cyan-400">Community &amp; Onboarding</p>
            <h2 className="text-2xl font-bold text-white mt-1">Active Initiatives &amp; Events</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Pre-Register Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <article
              key={evt.id || evt.title}
              className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-cyan-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {evt.eventDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {evt.location}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{evt.description}</p>
              </div>
              {evt.registrationLink && (
                <div className="pt-2">
                  <a
                    href={evt.registrationLink}
                    onClick={(e) => {
                      if (evt.registrationLink.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(evt.registrationLink as AppRoute);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 hover:text-lime-300"
                  >
                    <span>Participate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
