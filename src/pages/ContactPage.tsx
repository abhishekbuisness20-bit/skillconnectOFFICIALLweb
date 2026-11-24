import { useState, FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Mail, MapPin, Clock, CheckCircle2, Send, ExternalLink } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CMSSiteConfig } from '../types/cms';

interface ContactPageProps {
  siteConfig: CMSSiteConfig;
}

export function ContactPage({ siteConfig }: ContactPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const nameVal = fullName.trim();
    const emailVal = email.trim();
    const subjectVal = subject.trim();
    const messageVal = message.trim();

    if (nameVal.length < 2 || nameVal.length > 100) {
      setErrorMsg('Full name must be between 2 and 100 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || emailVal.length > 120) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (subjectVal.length < 2 || subjectVal.length > 150) {
      setErrorMsg('Subject must be between 2 and 150 characters.');
      return;
    }
    if (messageVal.length < 10 || messageVal.length > 2000) {
      setErrorMsg('Message must be between 10 and 2000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_inquiries'), {
        fullName: nameVal,
        email: emailVal,
        subject: subjectVal,
        message: messageVal,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccessMsg(
        'Your inquiry has been delivered to Founder Abhishek Singh and the SkillConnect Administration desk.'
      );
      setFullName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contact_inquiries', true);
      setErrorMsg(
        `Could not submit form right now. Please email us directly at ${siteConfig.contact.supportEmail}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      <section className="space-y-5 max-w-3xl">
        <p className="text-xs font-medium text-cyan-400">Contact Us &amp; Inquiries</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Direct Communication With SkillConnect Official
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Reach out for enterprise partnerships, customer support, provider verification assistance, or press inquiries across India.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Direct Channels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-5">
            <h2 className="text-xl font-bold text-white">Official Channels</h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Founder &amp; Official Support Email</p>
                  <a
                    href={`mailto:${siteConfig.contact.supportEmail}`}
                    className="text-white font-medium hover:text-cyan-300 underline underline-offset-4"
                  >
                    {siteConfig.contact.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Response Standard</p>
                  <p className="text-slate-200">{siteConfig.contact.responseSla}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Coverage</p>
                  <p className="text-slate-200">{siteConfig.contact.officeLocation}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-white">Verified Social Presence</p>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://www.instagram.com/skillconnectofficiall"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                >
                  <span>@skillconnectofficiall</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.instagram.com/abhishek_skillconnect?rpxt=MTFrM3l5b212OWpieA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                >
                  <span>Abhishek Singh (Founder) · @abhishek_skillconnect</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0A1024] p-7 sm:p-9 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Send a Direct Message</h2>
            <p className="text-sm text-slate-300">
              Your inquiry is securely stored and reviewed by our Administration team.
            </p>
          </div>

          {successMsg && (
            <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 p-4 flex items-start gap-3 text-sm text-lime-200">
              <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ct-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="ct-name"
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ct-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="ct-email"
                  type="email"
                  required
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ct-subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                Subject
              </label>
              <input
                id="ct-subject"
                type="text"
                required
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Partnership, Customer Support, Verification, or Press"
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ct-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                Message
              </label>
              <textarea
                id="ct-message"
                required
                rows={5}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share full context so our team can assist quickly (10–2000 characters)..."
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
