import { FormEvent, useEffect, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppRoute } from '../utils/seoRouting';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { GmailComposePreset, GmailWorkspacePanel } from '../components/GmailWorkspacePanel';

interface WorkspacePageProps {
  onNavigate: (route: AppRoute) => void;
}

export function WorkspacePage({ onNavigate }: WorkspacePageProps) {
  const {
    user,
    authReady,
    authError,
    workspaceLoading,
    workspaceError,
    profile,
    proposals,
    savedInsights,
    signInWithGoogle,
    signOutUser,
    refreshWorkspace,
    updateProfile,
    createProposal,
    updateProposalStatus,
    deleteProposal,
    deleteInsight,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [role, setRole] = useState('member');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  const [offeredSkill, setOfferedSkill] = useState('');
  const [requestedSkill, setRequestedSkill] = useState('');
  const [proposalCity, setProposalCity] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalSaving, setProposalSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [gmailPreset, setGmailPreset] = useState<GmailComposePreset | null>(null);

  const openGmailComposerWithPreset = (subject: string, body: string) => {
    setGmailPreset({
      subject,
      body,
      nonce: Date.now(),
    });
    const el = document.getElementById('gmail-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setCity(profile.city || '');
      setPrimarySkill(profile.primarySkill || '');
      setRole(profile.role || 'member');
    } else if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice('');
    setActionError('');
    try {
      await updateProfile({ displayName, city, primarySkill, role });
      setProfileNotice('Workspace profile saved.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateProposal = async (e: FormEvent) => {
    e.preventDefault();
    setProposalSaving(true);
    setActionError('');
    try {
      await createProposal({
        offeredSkill,
        requestedSkill,
        city: proposalCity || city || 'Pan-India / Remote',
        notes: proposalNotes,
      });
      setOfferedSkill('');
      setRequestedSkill('');
      setProposalCity('');
      setProposalNotes('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to create proposal.');
    } finally {
      setProposalSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-slate-400">
        Checking account session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-8 space-y-6 text-center">
          <UserCircle2 className="w-12 h-12 text-cyan-400 mx-auto" />
          <div className="space-y-2">
            <p className="text-xs font-medium text-cyan-400">Member Workspace</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Sign In to Your SkillConnect Workspace
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Manage your verified SkillConnect member profile, publish peer-to-peer skill exchange proposals, and save grounded India market briefs across sessions.
            </p>
          </div>

          {authError && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg p-3">
              {authError}
            </p>
          )}

          <div className="flex justify-center">
            <GoogleSignInButton
              onClick={() => void signInWithGoogle()}
              label="Sign in with Google"
            />
          </div>

          <p className="text-xs text-slate-500">
            Protected with Google Authentication · Manage saved data anytime under{' '}
            <button
              type="button"
              onClick={() => onNavigate('/deletion')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Account &amp; Data Deletion
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Member avatar'}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border border-cyan-500/40 object-cover"
            />
          ) : (
            <UserCircle2 className="w-12 h-12 text-cyan-400" />
          )}
          <div>
            <p className="text-xs font-medium text-cyan-400">Signed in · {user.email}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {profile?.displayName || user.displayName || 'Member Workspace'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refreshWorkspace()}
            disabled={workspaceLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${workspaceLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {(workspaceError || actionError) && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
          {actionError || workspaceError}
        </div>
      )}

      {profileNotice && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 px-4 py-3 flex items-center gap-2 text-xs text-lime-200">
          <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
          <span>{profileNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Form */}
        <section className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-5">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Member Identity &amp; Role</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                required
                minLength={2}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">City / Region (India)</label>
                <input
                  type="text"
                  placeholder="e.g., Bengaluru, Pune, Jaipur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Marketplace Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="member">Member / Explorer</option>
                  <option value="customer">Customer / Hiring Company</option>
                  <option value="provider">Verified Service Provider</option>
                  <option value="mentor">Practitioner / Mentor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Skill Discipline</label>
              <input
                type="text"
                placeholder="e.g., Full-Stack React, UI Design, Solar Installation"
                value={primarySkill}
                onChange={(e) => setPrimarySkill(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-60"
            >
              {profileSaving ? 'Saving Profile...' : 'Save Workspace Profile'}
            </button>
          </form>
        </section>

        {/* Peer-to-Peer Skill Exchange Proposals */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-lime-400">Peer-to-Peer Skill Barter</p>
              <h2 className="text-xl font-bold text-white">Create Skill Exchange Proposal</h2>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Skill You Offer</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    placeholder="e.g., Backend TypeScript Audit"
                    value={offeredSkill}
                    onChange={(e) => setOfferedSkill(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Skill You Need</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    placeholder="e.g., Figma Design System Review"
                    value={requestedSkill}
                    onChange={(e) => setRequestedSkill(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">City / Mode</label>
                  <input
                    type="text"
                    placeholder={city || 'Pan-India / Remote'}
                    value={proposalCity}
                    onChange={(e) => setProposalCity(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Milestones / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., Two 45-min paired sessions"
                    value={proposalNotes}
                    onChange={(e) => setProposalNotes(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={proposalSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400 text-slate-950 text-sm font-semibold hover:bg-lime-300 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                <span>{proposalSaving ? 'Publishing Proposal...' : 'Publish Exchange Proposal'}</span>
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">
              Your Skill Exchange Proposals ({proposals.length})
            </h3>
            {proposals.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#0A1024] p-6 text-sm text-slate-400">
                No exchange proposals yet. Create your first peer-to-peer skill proposal above.
              </div>
            ) : (
              proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-xl border border-white/10 bg-[#0A1024] p-5 flex flex-wrap items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-white">
                      Offering <span className="text-cyan-400">{prop.offeredSkill}</span> for{' '}
                      <span className="text-lime-400">{prop.requestedSkill}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {prop.city}
                      {prop.notes ? ` · ${prop.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={prop.status}
                      onChange={(e) =>
                        void updateProposalStatus(
                          prop.id,
                          e.target.value as 'open' | 'matched' | 'archived'
                        )
                      }
                      aria-label="Proposal status"
                      className="rounded-md border border-white/15 bg-[#050814] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="open">Open</option>
                      <option value="matched">Matched</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        openGmailComposerWithPreset(
                          `SkillConnect Skill Exchange: Offering ${prop.offeredSkill} for ${prop.requestedSkill}`,
                          `Hello,\n\nI am reaching out via SkillConnect Official regarding a peer-to-peer skill exchange:\n\n• Skill Offered: ${prop.offeredSkill}\n• Skill Requested: ${prop.requestedSkill}\n• Location / Mode: ${prop.city}\n${prop.notes ? `• Details: ${prop.notes}\n` : ''}\nLet me know if you would like to coordinate sessions.\n\nBest regards,\n${profile?.displayName || user.displayName || 'SkillConnect Member'}`
                        )
                      }
                      aria-label="Draft email via Gmail"
                      title="Email Proposal via Gmail"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteProposal(prop.id)}
                      aria-label="Delete proposal"
                      className="p-2 rounded-lg border border-white/10 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Saved Grounded Market Briefs */}
      <section className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              Saved Market Intelligence Briefs ({savedInsights.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            Run New India Market Search →
          </button>
        </div>

        {savedInsights.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0A1024] p-6 text-sm text-slate-400">
            Save live Google Search-grounded India skill market briefs from the Home page to keep verified demand research organized here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savedInsights.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-6 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-cyan-300">{item.queryTopic}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openGmailComposerWithPreset(
                            `India Market Brief: ${item.queryTopic}`,
                            `SkillConnect Market Brief — ${item.queryTopic}\n\n${item.summaryText}\n\n${
                              item.sources.length > 0
                                ? `Verified Sources:\n${item.sources.map((s) => `- ${s.title}: ${s.uri}`).join('\n')}`
                                : ''
                            }`
                          )
                        }
                        aria-label="Share brief via Gmail"
                        title="Share via Gmail"
                        className="p-1.5 rounded-md text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteInsight(item.id)}
                        aria-label="Delete saved brief"
                        className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {item.summaryText}
                  </p>
                </div>

                {item.sources.length > 0 && (
                  <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {item.sources.map((src) => (
                      <a
                        key={src.uri}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                      >
                        <span className="truncate max-w-[180px]">{src.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Connected Gmail Workspace */}
      <GmailWorkspacePanel composePreset={gmailPreset} />
    </div>
  );
}
