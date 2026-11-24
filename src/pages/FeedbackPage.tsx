import { useState, FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Star, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CMSSiteConfig, CommunityFeedback } from '../types/cms';

interface FeedbackPageProps {
  siteConfig: CMSSiteConfig;
  approvedFeedback: CommunityFeedback[];
}

export function FeedbackPage({ siteConfig, approvedFeedback }: FeedbackPageProps) {
  const [testerName, setTesterName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<'trades' | 'tech' | 'mentorship' | 'general'>('tech');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const nameVal = testerName.trim();
    const roleVal = role.trim();
    const cityVal = city.trim();
    const commentVal = comment.trim();

    if (nameVal.length < 2 || nameVal.length > 100) {
      setErrorMsg('Please enter your name (2–100 characters).');
      return;
    }
    if (roleVal.length < 2 || roleVal.length > 100) {
      setErrorMsg('Please enter your role or profession (2–100 characters).');
      return;
    }
    if (cityVal.length < 2 || cityVal.length > 60) {
      setErrorMsg('Please enter your city (2–60 characters).');
      return;
    }
    if (commentVal.length < 10 || commentVal.length > 1500) {
      setErrorMsg('Feedback comment must be between 10 and 1500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_feedback'), {
        testerName: nameVal,
        role: roleVal,
        city: cityVal,
        category,
        rating: Number(rating),
        comment: commentVal,
        status: 'pending_review',
        createdAt: serverTimestamp(),
      });
      setSuccessMsg(
        'Thank you! Your feedback has been submitted and is queued for Founder moderation before public display.'
      );
      setTesterName('');
      setRole('');
      setCity('');
      setRating(5);
      setComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'community_feedback', true);
      setErrorMsg('Unable to submit feedback right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews =
    approvedFeedback.length > 0
      ? approvedFeedback.map((fb) => ({
          id: fb.id || fb.testerName,
          name: fb.testerName,
          role: fb.role,
          city: fb.city,
          category: fb.category,
          rating: fb.rating,
          comment: fb.comment,
        }))
      : siteConfig.testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
          city: t.city,
          category: 'general',
          rating: 5,
          comment: t.quote,
        }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16">
      <section className="space-y-5 max-w-3xl">
        <p className="text-xs font-medium text-cyan-400">Community Feedback &amp; Reviews</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Built With Input From Indian Practitioners &amp; Testers
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Read verified community perspectives and submit your own suggestions on skills, trades, mentorship, or usability.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Approved Reviews List */}
        <div className="lg:col-span-6 space-y-5">
          <h2 className="text-xl font-bold text-white">Approved Community Voices</h2>
          <div className="space-y-4">
            {displayReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-cyan-400 capitalize">
                    {review.category}
                  </span>
                  <div className="flex items-center gap-1 text-lime-400" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: Math.max(1, Math.min(5, Math.round(review.rating))) }).map(
                      (_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      )
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">“{review.comment}”</p>
                <div className="pt-3 border-t border-white/10 text-xs text-slate-400">
                  <span className="font-semibold text-white">{review.name}</span> · {review.role} ·{' '}
                  {review.city}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Submit Feedback Form */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#0A1024] p-7 sm:p-9 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-lime-400">
              <MessageSquarePlus className="w-4 h-4" />
              <span>Submit Community Feedback</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Share Your Perspective</h2>
            <p className="text-sm text-slate-300">
              Approved feedback helps shape SkillConnect workflows across India.
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
                <label htmlFor="fb-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Name
                </label>
                <input
                  id="fb-name"
                  type="text"
                  required
                  maxLength={100}
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  placeholder="e.g. Sneha Iyer"
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="fb-role" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Role / Profession
                </label>
                <input
                  id="fb-role"
                  type="text"
                  required
                  maxLength={100}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. UI Designer / Electrician"
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fb-city" className="block text-xs font-medium text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  id="fb-city"
                  type="text"
                  required
                  maxLength={60}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="fb-cat" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Focus Area
                </label>
                <select
                  id="fb-cat"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as 'trades' | 'tech' | 'mentorship' | 'general')
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="tech">Tech &amp; Engineering</option>
                  <option value="trades">Skilled Trades</option>
                  <option value="mentorship">Mentorship</option>
                  <option value="general">General Experience</option>
                </select>
              </div>
              <div>
                <label htmlFor="fb-rating" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Rating (1–5)
                </label>
                <select
                  id="fb-rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fb-comment" className="block text-xs font-medium text-slate-300 mb-1.5">
                Your Review or Suggestion
              </label>
              <textarea
                id="fb-comment"
                required
                rows={4}
                maxLength={1500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what works well or what capabilities you want SkillConnect to prioritize..."
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
