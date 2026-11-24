import { ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { CMSSiteConfig } from '../types/cms';
import { CorporateMediaFrame } from '../components/CorporateMediaFrame';

interface AboutPageProps {
  siteConfig: CMSSiteConfig;
  onNavigate: (route: AppRoute) => void;
}

const LEADERSHIP_TEAM = [
  {
    name: 'Abhishek Singh',
    role: 'Founder & Developer',
    focus:
      'Conceived, architected, and engineered SkillConnect Official to connect verified Indian talent directly with customers and businesses.',
    instagram: 'https://www.instagram.com/abhishek_skillconnect?rpxt=MTFrM3l5b212OWpieA==',
    handle: '@abhishek_skillconnect',
  },
  {
    name: 'Abhay Singh',
    role: 'Administration Member',
    focus:
      'Oversees community onboarding operations, provider verification coordination, and regional outreach.',
    instagram: 'https://www.instagram.com/abhaysinghthakur6921chauhan?srtk=Z3gxcXhoa2ljMjQ2',
    handle: '@abhaysinghthakur6921chauhan',
  },
  {
    name: 'Adarsh Singh',
    role: 'Administration Member',
    focus:
      'Supports platform governance, user engagement feedback loops, and marketplace quality standards.',
    instagram: 'https://www.instagram.com/adarsh_edge?exln=d2J6bHViMnMxOWd4',
    handle: '@adarsh_edge',
  },
  {
    name: 'Abhay Bharti',
    role: 'Administration Member',
    focus:
      'Manages ecosystem partnerships, tester community coordination, and operational support across India.',
    instagram: 'https://www.instagram.com/itz_.harsh_.07?srtk=eXN0YTd5bmY2b2p4',
    handle: '@itz_.harsh_.07',
  },
];

export function AboutPage({ siteConfig, onNavigate }: AboutPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-20">
      {/* Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-xs font-semibold text-cyan-400">About Us &amp; Leadership</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {siteConfig.about.missionTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {siteConfig.about.missionBody}
          </p>
          <blockquote className="rounded-2xl border border-white/10 bg-[#090F22] p-6 text-sm sm:text-base text-slate-200 leading-relaxed">
            “{siteConfig.about.founderQuote}”
            <footer className="mt-3 text-xs font-semibold text-cyan-400">
              Abhishek Singh · Founder &amp; Developer, SkillConnect Official
            </footer>
          </blockquote>
        </div>
        <div className="lg:col-span-5">
          <CorporateMediaFrame
            src="/src/assets/images/company_hero_collaboration_1795498882931.jpg"
            alt="SkillConnect leadership and engineering collaboration in India"
            caption="Independent marketplace built for verifiable Indian talent"
            aspectClassName="aspect-[4/3]"
          />
        </div>
      </section>

      {/* Leadership Team */}
      <section className="space-y-8">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <p className="text-xs font-medium text-lime-400">Leadership &amp; Administration</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            The Team Building SkillConnect Official
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEADERSHIP_TEAM.map((member) => (
            <article
              key={member.name}
              className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium text-cyan-400">{member.role}</p>
                <h3 className="text-xl font-bold text-white">{member.name}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{member.focus}</p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <a
                  href={member.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4"
                >
                  <span>Instagram: {member.handle}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Official Contact & Next Actions */}
      <section className="rounded-2xl border border-white/10 bg-[#090F22] p-8 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-bold text-white">Connect With SkillConnect Leadership</h2>
          <p className="text-sm text-slate-300">
            For official partnerships, press verification, or platform support, reach out directly via our inquiry desk or email.
          </p>
          <p className="text-xs text-cyan-400 inline-flex items-center gap-2 pt-1">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${siteConfig.contact.supportEmail}`} className="underline">
              {siteConfig.contact.supportEmail}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            <span>Send Inquiry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="px-5 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
          >
            Provider Registration
          </button>
        </div>
      </section>
    </div>
  );
}
