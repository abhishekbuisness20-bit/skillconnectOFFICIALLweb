import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CMSSiteConfig } from '../types/cms';
import { ProviderRegistrationForm, SERVICE_CATEGORIES } from '../components/ProviderRegistrationForm';
import { CorporateMediaFrame } from '../components/CorporateMediaFrame';

interface ServicesPageProps {
  siteConfig: CMSSiteConfig;
  onOpenActivityModal: (actionType: string, targetFeature: string) => void;
}

export function ServicesPage({ siteConfig, onOpenActivityModal }: ServicesPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      {/* Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-semibold text-cyan-400">Skill-Based Services Marketplace</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Verified Services &amp; Provider Pre-Registration
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Customers and companies across India can request verified specialists for digital, technical, creative, or local services—and skilled professionals can pre-register for verification below.
          </p>
        </div>
        <div className="lg:col-span-5">
          <CorporateMediaFrame
            src="/src/assets/images/provider_field_craft_1795498884719.jpg"
            alt="Verified specialist performing commercial technical inspection"
            caption="Field and digital specialists vetted across Indian cities"
            aspectClassName="aspect-[4/3]"
          />
        </div>
      </section>

      {/* Service Verticals + Provider Intake Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#090F22] p-7 space-y-5">
            <h2 className="text-xl font-bold text-white">Active Marketplace Verticals</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select any vertical below to submit a customer service requirement directly to SkillConnect.
            </p>
            <div className="space-y-2.5">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onOpenActivityModal('Service Request', cat)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-[#050814] text-left text-sm text-slate-200 hover:border-cyan-500/40 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{cat}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090F22] p-6 space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-lime-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verification Standards</span>
            </div>
            <p>{siteConfig.homepage.releaseNote}</p>
            <p>
              All pre-registered providers undergo manual verification of experience and service scope before public directory activation.
            </p>
          </div>
        </div>

        {/* Service Provider Pre-Registration Form */}
        <div className="lg:col-span-7">
          <ProviderRegistrationForm idPrefix="services-sp" />
        </div>
      </section>
    </div>
  );
}
