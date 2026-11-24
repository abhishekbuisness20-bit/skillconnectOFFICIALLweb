import { useState, FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { X, CheckCircle2, Send } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ActivityDispatchModalProps {
  isOpen: boolean;
  actionType: string;
  targetFeature: string;
  onClose: () => void;
}

export function ActivityDispatchModal({
  isOpen,
  actionType,
  targetFeature,
  onClose,
}: ActivityDispatchModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedDetails = details.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setErrorMsg('Please enter your full name (2–100 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 120) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (trimmedDetails.length < 5 || trimmedDetails.length > 2500) {
      setErrorMsg('Please describe your requirement or request (5–2500 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'activity_reports'), {
        actionType: actionType.slice(0, 100),
        targetFeature: targetFeature.slice(0, 100),
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        details: trimmedDetails,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_reports', true);
      setErrorMsg('Could not submit request right now. Please try again or email singhabhishek83072@gmail.com.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCustomerName('');
    setCustomerEmail('');
    setDetails('');
    setErrorMsg('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0A1024] p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-cyan-400">
              {actionType} · {targetFeature}
            </p>
            <h2 id="activity-modal-title" className="text-xl font-bold text-white mt-1">
              Request {targetFeature}
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 text-lime-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="text-base font-semibold text-white">Request logged with SkillConnect</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your inquiry for <strong>{targetFeature}</strong> has been saved for review by Founder Abhishek Singh and the Administration team.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="act-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="act-name"
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="act-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                id="act-email"
                type="email"
                required
                maxLength={120}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="act-details" className="block text-xs font-medium text-slate-300 mb-1.5">
                Skills, Scope, or City Details
              </label>
              <textarea
                id="act-details"
                required
                rows={4}
                maxLength={2500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share the skills you are seeking or offering, preferred city/remote scope, and timeline..."
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 rounded-lg border border-white/15 text-sm font-medium text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
