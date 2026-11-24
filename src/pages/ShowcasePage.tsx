import { useState } from 'react';
import { Smartphone, ArrowRight, CheckCircle2, Layers, Shield, MessageCircle } from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { SkillConnect3DStudio } from '../components/SkillConnect3DStudio';

interface ShowcasePageProps {
  onNavigate: (route: AppRoute) => void;
}

const APP_MODULES = [
  {
    id: 'discovery',
    label: '01. Talent Discovery',
    icon: Layers,
    headline: 'City-Aware Provider Directory Across India',
    summary:
      'Filter verified specialists by skill category, city, state, and verified project track record without sifting through unverified listings.',
    previewTitle: 'Verified Specialists · Bengaluru & Remote',
    previewRows: [
      { name: 'React & Node.js Architecture', meta: '5+ yrs experience · Portfolio Verified' },
      { name: 'Product & Design Systems', meta: '4+ yrs experience · Case Studies Linked' },
      { name: 'Local Solar & Electrical Setup', meta: '7+ yrs experience · Field Verified' },
    ],
  },
  {
    id: 'exchange',
    label: '02. Skill Exchange',
    icon: Shield,
    headline: 'Structured Peer-to-Peer Skill Barter',
    summary:
      'Propose a bilateral exchange—offer your strength in one discipline while learning or receiving help in another, tracked with mutual milestones.',
    previewTitle: 'Active Skill Exchange Proposal',
    previewRows: [
      { name: 'Offered: TypeScript Backend Review', meta: '2 structured 45-min sessions' },
      { name: 'Requested: Mobile UI Accessibility Audit', meta: 'Figma + component tokens' },
      { name: 'Verification: Completion Sign-Off', meta: 'Adds peer proof to profile' },
    ],
  },
  {
    id: 'mentorship',
    label: '03. Direct Mentorship',
    icon: MessageCircle,
    headline: '1-on-1 Practitioner Guidance',
    summary:
      'Skip generic webinar broadcasts and schedule focused, goal-oriented mentorship conversations directly with vetted Indian practitioners.',
    previewTitle: 'Upcoming Mentorship Slot',
    previewRows: [
      { name: 'Portfolio & Resume Proof Audit', meta: '45 min · Direct Video / Audio' },
      { name: 'System Design Walkthrough', meta: '60 min · Live Diagramming' },
      { name: 'Freelance Pricing & Scope Strategy', meta: '30 min · India SME Focus' },
    ],
  },
];

export function ShowcasePage({ onNavigate }: ShowcasePageProps) {
  const [activeTab, setActiveTab] = useState(APP_MODULES[0].id);
  const activeModule = APP_MODULES.find((m) => m.id === activeTab) || APP_MODULES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      <section className="space-y-5 max-w-3xl">
        <p className="text-xs font-semibold text-cyan-400">
          Platform Technology &amp; Brand Architecture
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Built for Trust-First Collaboration Across India
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Explore the interactive 3D SkillConnect Core below and preview how customers, service providers, and mentors engage through the marketplace. Official Android app availability will be published on this portal once confirmed on Google Play.
        </p>
      </section>

      {/* Interactive Three.js 3D Studio Viewport */}
      <section aria-label="Interactive Three.js 3D Studio" className="space-y-4">
        <SkillConnect3DStudio />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Controls & Explanation */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Platform Workflow Previews">
            {APP_MODULES.map((mod) => {
              const selected = mod.id === activeTab;
              return (
                <button
                  key={mod.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(mod.id)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#090F22] border border-white/10 text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  {mod.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-4">
            <h2 className="text-2xl font-bold text-white">{activeModule.headline}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{activeModule.summary}</p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/services')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                <span>Register as Provider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/workspace')}
                className="px-5 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                Open Member Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Phone Preview */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[2.25rem] border border-white/15 bg-[#070B1E] p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <img
                  src="/favicon.png"
                  alt="SkillConnect App Icon"
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs font-bold text-white">SkillConnect</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400">
                <Smartphone className="w-3.5 h-3.5" />
                Android Preview
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-lime-400">{activeModule.label}</p>
              <h3 className="text-base font-bold text-white">{activeModule.previewTitle}</h3>
            </div>

            <div className="space-y-3">
              {activeModule.previewRows.map((row) => (
                <div
                  key={row.name}
                  className="rounded-xl border border-white/10 bg-[#050814] p-4 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{row.name}</p>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-slate-400">{row.meta}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-500 text-center">
              Neutral Preview · Official Google Play Store release announced upon confirmation
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
