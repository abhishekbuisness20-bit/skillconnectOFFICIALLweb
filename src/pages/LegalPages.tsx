import { useState, FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppRoute } from '../utils/seoRouting';

interface LegalPageProps {
  route: '/privacy' | '/terms' | '/disclaimer' | '/deletion';
  supportEmail: string;
  onNavigate: (route: AppRoute) => void;
}

export function LegalPages({ route, supportEmail, onNavigate }: LegalPageProps) {
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeletionRequest = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const nameVal = reqName.trim();
    const emailVal = reqEmail.trim();
    const reasonVal = reqReason.trim() || 'Account and personal data deletion request';

    if (nameVal.length < 2 || nameVal.length > 100) {
      setErrorMsg('Please enter your full name (2–100 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || emailVal.length > 120) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_inquiries'), {
        fullName: nameVal,
        email: emailVal,
        subject: 'Account & Data Deletion Request',
        message: `Deletion Request Details: ${reasonVal}`.slice(0, 2000),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setReqName('');
      setReqEmail('');
      setReqReason('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contact_inquiries', true);
      setErrorMsg(`Could not log deletion request online. Email ${supportEmail} directly.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-12">
      {/* Navigation Pills between Legal Docs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-6">
        {(
          [
            { route: '/privacy', label: 'Privacy Policy' },
            { route: '/terms', label: 'Terms & Conditions' },
            { route: '/disclaimer', label: 'Platform Disclaimer' },
            { route: '/deletion', label: 'Account & Data Deletion' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.route}
            type="button"
            onClick={() => onNavigate(tab.route)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              route === tab.route
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-[#0A1024] border border-white/10 text-slate-300 hover:border-cyan-500/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {route === '/privacy' && (
        <article className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Effective Date: November 2026</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Privacy Policy (India DPDP Act &amp; GDPR Aligned)
            </h1>
          </div>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">1. Data We Collect</h2>
            <p>
              SkillConnect Official collects only the information you explicitly provide when submitting a contact inquiry, requesting a service feature, submitting community feedback, or pre-registering as a service provider (such as your name, email address, phone number, city/state, skill category, and work bio).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">2. Purpose &amp; Legal Basis</h2>
            <p>
              Collected data is used strictly to review provider verification applications, respond to customer inquiries, moderate community reviews, and improve platform reliability under the Digital Personal Data Protection (DPDP) Act, 2023 (India) and GDPR principles. We do not sell personal contact records to third-party data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">3. Security &amp; Access Isolation</h2>
            <p>
              All personal inquiry, provider intake, and user profile records are protected by strict access rules so private PII is readable only by the authorized account owner or verified SkillConnect Administration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">4. Your Rights &amp; Contact</h2>
            <p>
              You may request access, correction, or complete deletion of your submitted records at any time via our{' '}
              <button
                type="button"
                onClick={() => onNavigate('/deletion')}
                className="text-cyan-400 underline cursor-pointer"
              >
                Account &amp; Data Deletion Protocol
              </button>{' '}
              or by emailing{' '}
              <a href={`mailto:${supportEmail}`} className="text-cyan-400 underline">
                {supportEmail}
              </a>
              .
            </p>
          </section>
        </article>
      )}

      {route === '/terms' && (
        <article className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Effective Date: November 2026</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms &amp; Conditions</h1>
          </div>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing skillconnectofficial.cloud.run or submitting inquiries, provider registrations, or community feedback, you agree to provide truthful, accurate information and comply with applicable laws of India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">2. Independent Marketplace Role</h2>
            <p>
              SkillConnect Official facilitates discovery and direct connection between customers, verified service providers, mentors, and businesses. Commercial contracts, pricing milestones, and service deliverables agreed directly between parties remain the responsibility of those contracting parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">3. Verification &amp; Moderation</h2>
            <p>
              SkillConnect reserves the right to verify, approve, suspend, or remove provider applications or community feedback that violate accuracy, safety, or respectful conduct standards.
            </p>
          </section>
        </article>
      )}

      {route === '/disclaimer' && (
        <article className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Platform Governance</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Platform Disclaimer</h1>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
              <ShieldAlert className="w-5 h-5" />
              <span>Important Transparency Notice</span>
            </div>
            <p>
              SkillConnect Official is an independent platform founded and engineered by Abhishek Singh. While we review provider experience and portfolio submissions during onboarding, users should independently confirm project scope, licensing, and terms before entering commercial engagements.
            </p>
            <p>
              Official mobile application release links on Google Play Store or other app marketplaces are valid only when published directly on skillconnectofficial.cloud.run or our verified @skillconnectofficiall channels.
            </p>
          </div>
        </article>
      )}

      {route === '/deletion' && (
        <article className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Data Rights &amp; Erasure</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Account &amp; Data Deletion Protocol
            </h1>
            <p>
              In accordance with Google Play Data Safety guidelines and India’s DPDP Act, you can request permanent deletion of your SkillConnect profile, provider pre-registration, or inquiry records below.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-5">
            <h2 className="text-xl font-bold text-white">Submit Deletion Request</h2>
            {submitted ? (
              <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 p-4 flex items-start gap-3 text-sm text-lime-200">
                <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                <p>
                  Your account &amp; data deletion request has been logged. Our Administration desk will complete verification and erase matching records within 7 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeletionRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="del-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="del-name"
                      type="text"
                      required
                      maxLength={100}
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Registered full name"
                      className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="del-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <input
                      id="del-email"
                      type="email"
                      required
                      maxLength={120}
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="del-reason" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Records to Delete (Optional Details)
                  </label>
                  <textarea
                    id="del-reason"
                    rows={3}
                    maxLength={1500}
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="e.g., Delete my provider pre-registration and contact inquiry history"
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                {errorMsg && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting Request...' : 'Request Data Erasure'}
                </button>
              </form>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
