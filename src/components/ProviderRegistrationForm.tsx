import { FormEvent, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, UserCheck } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const SERVICE_CATEGORIES = [
  'Software & Web Engineering',
  'UI/UX & Product Design',
  'Digital Marketing & SEO',
  'Technical Consulting & Mentorship',
  'Content, Video & Creative Media',
  'Electrical, Plumbing & Home Trades',
  'Appliance & Hardware Repair',
  'Education, Coaching & Skill Training',
];

export const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Delhi NCR',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'West Bengal',
  'Rajasthan',
  'Kerala',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Other Indian State / UT',
];

interface ProviderRegistrationFormProps {
  idPrefix?: string;
  initialCategory?: string;
  className?: string;
}

export function ProviderRegistrationForm({
  idPrefix = 'sp',
  initialCategory = SERVICE_CATEGORIES[0],
  className = '',
}: ProviderRegistrationFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState('');
  const [state, setState] = useState(INDIAN_STATES[0]);
  const [experienceYears, setExperienceYears] = useState('2');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegisterProvider = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const nameVal = fullName.trim();
    const phoneVal = phone.trim();
    const emailVal = email.trim();
    const cityVal = city.trim();
    const bioVal = bio.trim();
    const expNum = Number(experienceYears);

    if (nameVal.length < 2 || nameVal.length > 100) {
      setErrorMsg('Full name must be between 2 and 100 characters.');
      return;
    }
    if (phoneVal.length < 10 || phoneVal.length > 20) {
      setErrorMsg('Please enter a valid 10–15 digit phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || emailVal.length > 120) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (cityVal.length < 2 || cityVal.length > 60) {
      setErrorMsg('Please enter your city (2–60 characters).');
      return;
    }
    if (Number.isNaN(expNum) || expNum < 0 || expNum > 50) {
      setErrorMsg('Years of experience must be between 0 and 50.');
      return;
    }
    if (bioVal.length < 10 || bioVal.length > 1000) {
      setErrorMsg('Please provide a bio & work summary (10–1000 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'service_providers'), {
        fullName: nameVal,
        phone: phoneVal,
        email: emailVal,
        category: category.slice(0, 60),
        city: cityVal,
        state: state.slice(0, 60),
        experienceYears: expNum,
        bio: bioVal,
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      });
      setSuccessMsg(
        'Pre-registration submitted! Your provider profile is queued for verification by the SkillConnect Administration team.'
      );
      setFullName('');
      setPhone('');
      setEmail('');
      setCity('');
      setExperienceYears('2');
      setBio('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'service_providers', true);
      setErrorMsg(
        'Could not save registration right now. Please verify all fields and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#090F22] p-7 sm:p-9 space-y-6 ${className}`}
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-lime-400">
          <UserCheck className="w-4 h-4" />
          <span>Service Provider Intake</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Pre-Register as a Verified Service Provider
        </h2>
        <p className="text-sm text-slate-300">
          Submit your professional background, primary skill category, and city coverage in India.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 p-4 flex items-start gap-3 text-sm text-lime-200">
          <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleRegisterProvider} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`${idPrefix}-name`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Full Name
            </label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya Deshmukh"
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-phone`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Phone Number (India)
            </label>
            <input
              id={`${idPrefix}-phone`}
              type="tel"
              required
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`${idPrefix}-email`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <input
              id={`${idPrefix}-email`}
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="provider@example.com"
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-category`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Primary Skill Category
            </label>
            <select
              id={`${idPrefix}-category`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor={`${idPrefix}-city`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              City
            </label>
            <input
              id={`${idPrefix}-city`}
              type="text"
              required
              maxLength={60}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lucknow"
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-state`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              State
            </label>
            <select
              id={`${idPrefix}-state`}
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-exp`}
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Experience (Years)
            </label>
            <input
              id={`${idPrefix}-exp`}
              type="number"
              required
              min={0}
              max={50}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-bio`}
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Skills Summary, Portfolio Links &amp; Past Projects
          </label>
          <textarea
            id={`${idPrefix}-bio`}
            required
            rows={4}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your services, tools, certifications, or live project links (10–1000 characters)..."
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
          {submitting ? 'Submitting Registration...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
