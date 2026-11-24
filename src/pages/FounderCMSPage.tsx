import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  Save,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Plus,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFounderUser,
  OperationType,
} from '../firebase';
import {
  ActivityReport,
  CMSAnnouncement,
  CMSAuditLog,
  CMSBanner,
  CMSEvent,
  CMSRevision,
  CMSSiteConfig,
  CommunityFeedback,
  ContactInquiry,
  DEFAULT_SITE_CONFIG,
  sanitizeLegacyCMSConfig,
  ServiceProvider,
  SiteTrafficStats,
} from '../types/cms';

type CMSTab = 'overview' | 'content' | 'announcements' | 'inquiries' | 'providers' | 'feedback' | 'revisions';

export function FounderCMSPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<CMSTab>('overview');

  const [siteDraft, setSiteDraft] = useState<CMSSiteConfig>(DEFAULT_SITE_CONFIG);
  const [traffic, setTraffic] = useState<SiteTrafficStats | null>(null);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [feedbackList, setFeedbackList] = useState<CommunityFeedback[]>([]);
  const [announcements, setAnnouncements] = useState<CMSAnnouncement[]>([]);
  const [banners, setBanners] = useState<CMSBanner[]>([]);
  const [events, setEvents] = useState<CMSEvent[]>([]);
  const [revisions, setRevisions] = useState<CMSRevision[]>([]);
  const [auditLogs, setAuditLogs] = useState<CMSAuditLog[]>([]);

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMsg, setNewAnnMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const authorized = isFounderUser(user);

  const loadCMSWorkspace = async () => {
    if (!authorized || !user) return;
    try {
      const [
        cfgSnap,
        trafficSnap,
        inqSnap,
        repSnap,
        provSnap,
        fbSnap,
        annSnap,
        banSnap,
        evtSnap,
        revSnap,
        logSnap,
      ] = await Promise.all([
        getDoc(doc(db, 'cms_config', 'site_published')),
        getDoc(doc(db, 'site_analytics', 'traffic')),
        getDocs(query(collection(db, 'contact_inquiries'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'activity_reports'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'service_providers'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'community_feedback'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'cms_announcements')),
        getDocs(collection(db, 'cms_banners')),
        getDocs(collection(db, 'cms_events')),
        getDocs(query(collection(db, 'cms_revisions'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'cms_audit_logs'), orderBy('createdAt', 'desc'))),
      ]);

      if (cfgSnap.exists()) {
        setSiteDraft(sanitizeLegacyCMSConfig(cfgSnap.data() as Partial<CMSSiteConfig>));
      }
      if (trafficSnap.exists()) {
        setTraffic(trafficSnap.data() as SiteTrafficStats);
      }

      setInquiries(inqSnap.docs.map((d) => ({ ...(d.data() as ContactInquiry), id: d.id })));
      setReports(repSnap.docs.map((d) => ({ ...(d.data() as ActivityReport), id: d.id })));
      setProviders(provSnap.docs.map((d) => ({ ...(d.data() as ServiceProvider), id: d.id })));
      setFeedbackList(fbSnap.docs.map((d) => ({ ...(d.data() as CommunityFeedback), id: d.id })));
      setAnnouncements(annSnap.docs.map((d) => ({ ...(d.data() as CMSAnnouncement), id: d.id })));
      setBanners(banSnap.docs.map((d) => ({ ...(d.data() as CMSBanner), id: d.id })));
      setEvents(evtSnap.docs.map((d) => ({ ...(d.data() as CMSEvent), id: d.id })));
      setRevisions(revSnap.docs.map((d) => ({ ...(d.data() as CMSRevision), id: d.id })));
      setAuditLogs(logSnap.docs.map((d) => ({ ...(d.data() as CMSAuditLog), id: d.id })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'founder_cms_workspace', true);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadCMSWorkspace();
    }
  }, [authorized]);

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const recordAudit = async (action: string, module: string, summary: string) => {
    if (!user?.email) return;
    await addDoc(collection(db, 'cms_audit_logs'), {
      action: action.slice(0, 80),
      module: module.slice(0, 80),
      summary: summary.slice(0, 500),
      actorEmail: user.email.slice(0, 120),
      createdAt: serverTimestamp(),
    });
  };

  const handlePublishSiteConfig = async () => {
    if (!user) return;
    setSaving(true);
    setStatusNote('');
    try {
      const payload = {
        status: 'published' as const,
        homepage: siteDraft.homepage,
        about: siteDraft.about,
        contact: siteDraft.contact,
        seo: siteDraft.seo,
        services: siteDraft.services,
        testimonials: siteDraft.testimonials,
        faqs: siteDraft.faqs || [],
        updatedBy: (user.email || 'Founder').slice(0, 120),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'cms_config', 'site_published'), payload);
      await addDoc(collection(db, 'cms_revisions'), {
        label: `Published snapshot (${new Date().toISOString().slice(0, 16)})`,
        authorEmail: (user.email || 'Founder').slice(0, 120),
        snapshotData: {
          homepage: siteDraft.homepage,
          about: siteDraft.about,
          contact: siteDraft.contact,
          seo: siteDraft.seo,
        },
        createdAt: serverTimestamp(),
      });
      await recordAudit('publish', 'cms_config', 'Published live site configuration');
      setStatusNote('Site configuration published and revision snapshot saved.');
      await loadCMSWorkspace();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cms_config/site_published', true);
      setStatusNote('Failed to publish site configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnMsg.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'cms_announcements'), {
        title: newAnnTitle.trim().slice(0, 140),
        message: newAnnMsg.trim().slice(0, 600),
        type: 'info',
        linkText: 'Register as Provider',
        linkUrl: '/services',
        startDate: '2026-01-01',
        expiryDate: '2027-12-31',
        status: 'published',
        updatedAt: serverTimestamp(),
      });
      await recordAudit('create', 'cms_announcements', `Published announcement: ${newAnnTitle.trim()}`);
      setNewAnnTitle('');
      setNewAnnMsg('');
      setStatusNote('Announcement published.');
      await loadCMSWorkspace();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'cms_announcements', true);
      setStatusNote('Could not publish announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (colName: string, docId: string) => {
    try {
      await deleteDoc(doc(db, colName, docId));
      await recordAudit('delete', colName, `Deleted record ${docId}`);
      await loadCMSWorkspace();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${docId}`, true);
    }
  };

  const handleUpdateStatus = async (colName: string, docId: string, status: string) => {
    try {
      await updateDoc(doc(db, colName, docId), { status });
      await recordAudit('update', colName, `Set ${docId} status -> ${status}`);
      await loadCMSWorkspace();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${colName}/${docId}`, true);
    }
  };

  const handleRollbackRevision = async (rev: CMSRevision) => {
    if (!rev.snapshotData) return;
    setSaving(true);
    try {
      const snap = rev.snapshotData as Partial<CMSSiteConfig>;
      const merged = sanitizeLegacyCMSConfig({
        ...siteDraft,
        homepage: snap.homepage || siteDraft.homepage,
        about: snap.about || siteDraft.about,
        contact: snap.contact || siteDraft.contact,
        seo: snap.seo || siteDraft.seo,
      });
      setSiteDraft(merged);
      await setDoc(doc(db, 'cms_config', 'site_published'), {
        ...merged,
        status: 'published',
        updatedBy: (user?.email || 'Founder').slice(0, 120),
        updatedAt: serverTimestamp(),
      });
      await recordAudit('rollback', 'cms_revisions', `Rolled back to ${rev.label}`);
      setStatusNote(`Restored snapshot: ${rev.label}`);
      await loadCMSWorkspace();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cms_config/site_published', true);
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-slate-400">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-8 space-y-6 text-center">
          <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Founder CMS Console</h1>
            <p className="text-sm text-slate-300">
              Sign in with the authorized SkillConnect Founder Google account to manage content, provider approvals, inquiries, and revisions.
            </p>
          </div>
          {authError && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg p-3">
              {authError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSignIn}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer w-full"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="rounded-2xl border border-rose-500/30 bg-[#0A1024] p-8 space-y-5 text-center">
          <h1 className="text-xl font-bold text-white">Access Restricted</h1>
          <p className="text-sm text-slate-300">
            Signed in as <strong className="text-white">{user.email}</strong>, which is not authorized for Founder CMS administration.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-medium text-cyan-400">Private Administration · {user.email}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">SkillConnect Founder CMS</h1>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {statusNote && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 px-4 py-3 flex items-center gap-2.5 text-sm text-lime-200">
          <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
          <span>{statusNote}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'content', label: 'Site Content' },
            { id: 'announcements', label: `Announcements (${announcements.length})` },
            { id: 'inquiries', label: `Inquiries (${inquiries.length + reports.length})` },
            { id: 'providers', label: `Providers (${providers.length})` },
            { id: 'feedback', label: `Feedback (${feedbackList.length})` },
            { id: 'revisions', label: `Revisions & Logs (${revisions.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-[#0A1024] border border-white/10 text-slate-300 hover:border-cyan-500/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-1">
            <p className="text-xs text-slate-400">Total Page Views</p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {traffic?.totalPageViews ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-1">
            <p className="text-xs text-slate-400">Unique Sessions</p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {traffic?.uniqueSessions ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-1">
            <p className="text-xs text-slate-400">Provider Registrations</p>
            <p className="text-3xl font-bold text-lime-400 font-mono tabular-nums">
              {providers.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-1">
            <p className="text-xs text-slate-400">Banners &amp; Events</p>
            <p className="text-3xl font-bold text-cyan-400 font-mono tabular-nums">
              {banners.length + events.length}
            </p>
          </div>
        </div>
      )}

      {/* Site Content Editor */}
      {activeTab === 'content' && (
        <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-7 space-y-5">
          <h2 className="text-xl font-bold text-white">Published Homepage &amp; Contact Copy</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hero Kicker</label>
              <input
                type="text"
                value={siteDraft.homepage.kicker}
                onChange={(e) =>
                  setSiteDraft({
                    ...siteDraft,
                    homepage: { ...siteDraft.homepage, kicker: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hero Headline</label>
              <input
                type="text"
                value={siteDraft.homepage.heroTitle}
                onChange={(e) =>
                  setSiteDraft({
                    ...siteDraft,
                    homepage: { ...siteDraft.homepage, heroTitle: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hero Subtitle</label>
              <textarea
                rows={3}
                value={siteDraft.homepage.heroSubtitle}
                onChange={(e) =>
                  setSiteDraft({
                    ...siteDraft,
                    homepage: { ...siteDraft.homepage, heroSubtitle: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Release Availability Note</label>
              <input
                type="text"
                value={siteDraft.homepage.promoRibbonText}
                onChange={(e) =>
                  setSiteDraft({
                    ...siteDraft,
                    homepage: { ...siteDraft.homepage, promoRibbonText: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handlePublishSiteConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Live Changes'}</span>
          </button>
        </div>
      )}

      {/* Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A1024] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Create Announcement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                placeholder="Announcement title"
                className="rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                value={newAnnMsg}
                onChange={(e) => setNewAnnMsg(e.target.value)}
                placeholder="Announcement message"
                className="rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateAnnouncement}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Announcement</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-white">{ann.title}</p>
                  <p className="text-xs text-slate-300 mt-1">{ann.message}</p>
                </div>
                {ann.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc('cms_announcements', ann.id!)}
                    className="p-2 rounded-lg border border-white/10 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inquiries & Activity Reports */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Contact Inquiries ({inquiries.length})</h2>
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">
                    {inq.subject} · <span className="text-cyan-400">{inq.fullName}</span> ({inq.email})
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={inq.status}
                      onChange={(e) => inq.id && handleUpdateStatus('contact_inquiries', inq.id, e.target.value)}
                      className="rounded-md border border-white/15 bg-[#050814] px-2 py-1 text-xs text-white"
                    >
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                    </select>
                    {inq.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('contact_inquiries', inq.id!)}
                        className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300">{inq.message}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-white pt-4">Activity Reports ({reports.length})</h2>
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">
                    {rep.actionType} · {rep.targetFeature || 'Platform'} · {rep.customerName} ({rep.customerEmail})
                  </p>
                  <select
                    value={rep.status}
                    onChange={(e) => rep.id && handleUpdateStatus('activity_reports', rep.id, e.target.value)}
                    className="rounded-md border border-white/15 bg-[#050814] px-2 py-1 text-xs text-white"
                  >
                    <option value="new">new</option>
                    <option value="in_review">in_review</option>
                    <option value="contacted">contacted</option>
                  </select>
                </div>
                <p className="text-xs text-slate-300">{rep.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Providers */}
      {activeTab === 'providers' && (
        <div className="space-y-3">
          {providers.map((prov) => (
            <div
              key={prov.id}
              className="rounded-xl border border-white/10 bg-[#0A1024] p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">
                    {prov.fullName} · {prov.category}
                  </p>
                  <p className="text-xs text-slate-400">
                    {prov.city}, {prov.state} · {prov.experienceYears} yrs · {prov.phone} · {prov.email}
                  </p>
                </div>
                <select
                  value={prov.status}
                  onChange={(e) => prov.id && handleUpdateStatus('service_providers', prov.id, e.target.value)}
                  className="rounded-md border border-white/15 bg-[#050814] px-2 py-1 text-xs text-white"
                >
                  <option value="pending_verification">pending_verification</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>
              <p className="text-xs text-slate-300">{prov.bio}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Moderation */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {feedbackList.map((fb) => (
            <div
              key={fb.id}
              className="rounded-xl border border-white/10 bg-[#0A1024] p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">
                  {fb.testerName} ({fb.role}, {fb.city}) · {fb.rating}/5
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={fb.status}
                    onChange={(e) => fb.id && handleUpdateStatus('community_feedback', fb.id, e.target.value)}
                    className="rounded-md border border-white/15 bg-[#050814] px-2 py-1 text-xs text-white"
                  >
                    <option value="pending_review">pending_review</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                  {fb.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc('community_feedback', fb.id!)}
                      className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300">{fb.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revisions & Audit Logs */}
      {activeTab === 'revisions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Revision Snapshots</h2>
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{rev.label}</p>
                  <p className="text-xs text-slate-400">{rev.authorEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRollbackRevision(rev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs font-medium hover:bg-cyan-500/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Immutable Audit Log</h2>
            {auditLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-white/10 bg-[#0A1024] p-4 space-y-1"
              >
                <p className="text-xs font-semibold text-cyan-400">
                  {log.action} · {log.module}
                </p>
                <p className="text-xs text-slate-200">{log.summary}</p>
                <p className="text-[11px] text-slate-500">{log.actorEmail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
