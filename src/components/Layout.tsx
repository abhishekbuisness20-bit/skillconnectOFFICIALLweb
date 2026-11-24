import { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppRoute } from '../utils/seoRouting';
import { CMSAnnouncement } from '../types/cms';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  announcements: CMSAnnouncement[];
  supportEmail: string;
  children: ReactNode;
}

const TOP_NAV_ITEMS: { label: string; route: AppRoute }[] = [
  { label: 'Home', route: '/' },
  { label: 'About', route: '/about' },
  { label: 'Services', route: '/services' },
  { label: 'Features', route: '/features' },
  { label: 'Contact', route: '/contact' },
];

const FOOTER_PUBLIC_LINKS: { label: string; route: AppRoute }[] = [
  { label: 'Home', route: '/' },
  { label: 'About Company', route: '/about' },
  { label: 'Services & Provider Intake', route: '/services' },
  { label: 'Capabilities & Features', route: '/features' },
  { label: 'Platform Showcase & 3D', route: '/showcase' },
  { label: 'Launch Roadmap', route: '/launch' },
  { label: 'Community Feedback', route: '/feedback' },
  { label: 'Contact Us', route: '/contact' },
];

const FOOTER_LEGAL_LINKS: { label: string; route: AppRoute }[] = [
  { label: 'Privacy Policy', route: '/privacy' },
  { label: 'Terms & Conditions', route: '/terms' },
  { label: 'Platform Disclaimer', route: '/disclaimer' },
  { label: 'Account & Data Deletion', route: '/deletion' },
];

export function Layout({
  currentRoute,
  onNavigate,
  announcements,
  supportEmail,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  const activeAnnouncement = announcements.find((a) => a.status === 'published');

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, route: AppRoute) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  const firstName =
    (profile?.displayName || user?.displayName || '').trim().split(/\s+/)[0] || 'Member';

  return (
    <div className="min-h-screen flex flex-col bg-[#050814] text-slate-100">
      {/* Sticky Single-Row Three-Zone Corporate Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050814]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            <img
              src="/favicon.png"
              alt="SkillConnect Official Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>SkillConnect</span>
          </a>

          {/* Zone 2: 5 concise single-line corporate navigation links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-7">
            {TOP_NAV_ITEMS.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <a
                  key={item.route}
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 py-1 ${
                    isActive
                      ? 'text-cyan-400 border-cyan-400'
                      : 'text-slate-300 border-transparent hover:text-white hover:border-white/25'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action CTA + Mobile Drawer Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/services"
              onClick={(e) => handleLinkClick(e, '/services')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Register as Provider
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-white/15 text-slate-200 hover:bg-white/5 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#070B1E] px-4 py-4 space-y-2">
            <nav aria-label="Mobile Navigation" className="grid grid-cols-1 gap-1">
              {[
                ...TOP_NAV_ITEMS,
                { label: 'Platform Showcase & 3D', route: '/showcase' as AppRoute },
                {
                  label: user ? `Member Workspace (${firstName})` : 'Member Workspace',
                  route: '/workspace' as AppRoute,
                },
                { label: 'Launch Roadmap', route: '/launch' as AppRoute },
                { label: 'Community Feedback', route: '/feedback' as AppRoute },
              ].map((item) => (
                <a
                  key={item.route}
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  className={`min-h-[44px] px-3 rounded-lg flex items-center text-sm font-medium ${
                    currentRoute === item.route
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Non-sticky Announcement Strip below header */}
      {activeAnnouncement && currentRoute === '/' && (
        <div className="border-b border-white/10 bg-[#080E23]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <p className="text-slate-300">
              <span className="font-semibold text-cyan-400 mr-2">{activeAnnouncement.title}:</span>
              {activeAnnouncement.message}
            </p>
            {activeAnnouncement.linkText && (
              <a
                href={activeAnnouncement.linkUrl || '/services'}
                onClick={(e) => {
                  const target = (activeAnnouncement.linkUrl || '/services') as AppRoute;
                  if (target.startsWith('/')) {
                    handleLinkClick(e, target);
                  }
                }}
                className="font-semibold text-lime-400 hover:text-lime-300 whitespace-nowrap shrink-0 underline underline-offset-4"
              >
                {activeAnnouncement.linkText}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Quiet Editorial Corporate Footer */}
      <footer className="border-t border-white/10 bg-[#040712] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <a
                href="/"
                onClick={(e) => handleLinkClick(e, '/')}
                className="inline-flex items-center gap-2.5 text-lg font-bold text-white"
              >
                <img
                  src="/favicon.png"
                  alt="SkillConnect Official Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>SkillConnect Official</span>
              </a>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                India’s independent skill-based services company and marketplace connecting customers, verified service providers, and enterprises. Founded and engineered by Abhishek Singh.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  Official Email:{' '}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                  >
                    {supportEmail}
                  </a>
                </p>
                <p>
                  Official Instagram:{' '}
                  <a
                    href="https://www.instagram.com/skillconnectofficiall"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white underline underline-offset-4"
                  >
                    @skillconnectofficiall
                  </a>
                </p>
              </div>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-slate-300">Company &amp; Marketplace</h2>
              <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {FOOTER_PUBLIC_LINKS.map((item) => (
                  <li key={item.route}>
                    <a
                      href={item.route}
                      onClick={(e) => handleLinkClick(e, item.route)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-slate-300">Trust &amp; Governance</h2>
              <ul className="space-y-2 text-sm">
                {FOOTER_LEGAL_LINKS.map((item) => (
                  <li key={item.route}>
                    <a
                      href={item.route}
                      onClick={(e) => handleLinkClick(e, item.route)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="/workspace"
                    onClick={(e) => handleLinkClick(e, '/workspace')}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
                  >
                    {user ? `Member Workspace & Gmail (${firstName})` : 'Member Workspace & Gmail'}
                  </a>
                </li>
                <li>
                  <a
                    href="/founder-cms"
                    onClick={(e) => handleLinkClick(e, '/founder-cms')}
                    className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
                  >
                    Founder CMS Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 SkillConnect Official (skillconnectofficial.cloud.run). All rights reserved.</p>
            <p>Serving Customers, Verified Providers &amp; Companies Across India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
