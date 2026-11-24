import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CMSAnnouncement,
  CMSBanner,
  CMSEvent,
  CMSSiteConfig,
  CommunityFeedback,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_BANNERS,
  DEFAULT_EVENTS,
  DEFAULT_SITE_CONFIG,
  sanitizeLegacyCMSConfig,
  sanitizeLegacyText,
} from '../types/cms';
import { isSearchCrawler } from '../utils/seoRouting';

export interface UseCMSDataResult {
  siteConfig: CMSSiteConfig;
  banners: CMSBanner[];
  announcements: CMSAnnouncement[];
  events: CMSEvent[];
  approvedFeedback: CommunityFeedback[];
  loading: boolean;
}

export function useCMSData(currentPath: string): UseCMSDataResult {
  const [siteConfig, setSiteConfig] = useState<CMSSiteConfig>(DEFAULT_SITE_CONFIG);
  const [banners, setBanners] = useState<CMSBanner[]>(DEFAULT_BANNERS);
  const [announcements, setAnnouncements] = useState<CMSAnnouncement[]>(DEFAULT_ANNOUNCEMENTS);
  const [events, setEvents] = useState<CMSEvent[]>(DEFAULT_EVENTS);
  const [approvedFeedback, setApprovedFeedback] = useState<CommunityFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Search crawlers render directly from bundled public defaults without opening Firestore Listen channels
    if (isSearchCrawler()) {
      return;
    }

    setLoading(true);

    const unsubConfig = onSnapshot(
      doc(db, 'cms_config', 'site_published'),
      (snap) => {
        if (snap.exists()) {
          setSiteConfig(sanitizeLegacyCMSConfig(snap.data() as Partial<CMSSiteConfig>));
        } else {
          setSiteConfig(DEFAULT_SITE_CONFIG);
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'cms_config/site_published', true);
        setLoading(false);
      }
    );

    const unsubBanners = onSnapshot(
      query(collection(db, 'cms_banners'), where('status', '==', 'published')),
      (snap) => {
        const items: CMSBanner[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as CMSBanner;
          if (data.enabled) {
            items.push({
              ...data,
              id: docSnap.id,
              title: sanitizeLegacyText(data.title, 'SkillConnect Official Update'),
              subtitle: sanitizeLegacyText(
                data.subtitle,
                'Verified skill services and provider pre-registration across India.'
              ),
            });
          }
        });
        setBanners(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cms_banners', true);
      }
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'cms_announcements'), where('status', '==', 'published')),
      (snap) => {
        const items: CMSAnnouncement[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as CMSAnnouncement;
          items.push({
            ...data,
            id: docSnap.id,
            title: sanitizeLegacyText(data.title, DEFAULT_ANNOUNCEMENTS[0].title),
            message: sanitizeLegacyText(data.message, DEFAULT_ANNOUNCEMENTS[0].message),
          });
        });
        setAnnouncements(items.length > 0 ? items : DEFAULT_ANNOUNCEMENTS);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cms_announcements', true);
      }
    );

    const unsubEvents = onSnapshot(
      query(collection(db, 'cms_events'), where('status', '==', 'published')),
      (snap) => {
        const items: CMSEvent[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as CMSEvent;
          items.push({
            ...data,
            id: docSnap.id,
            title: sanitizeLegacyText(data.title, 'SkillConnect Community Event'),
            description: sanitizeLegacyText(data.description, data.description),
            eventDate: sanitizeLegacyText(data.eventDate, 'Upcoming'),
          });
        });
        setEvents(items.length > 0 ? items : DEFAULT_EVENTS);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cms_events', true);
      }
    );

    const unsubFeedback = onSnapshot(
      query(collection(db, 'community_feedback'), where('status', '==', 'approved')),
      (snap) => {
        const items: CommunityFeedback[] = [];
        snap.forEach((docSnap) => {
          items.push({ ...(docSnap.data() as CommunityFeedback), id: docSnap.id });
        });
        setApprovedFeedback(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'community_feedback', true);
      }
    );

    return () => {
      unsubConfig();
      unsubBanners();
      unsubAnnouncements();
      unsubEvents();
      unsubFeedback();
    };
  }, []);

  // Track real visitor page views (skipped for search crawlers)
  useEffect(() => {
    if (isSearchCrawler() || currentPath === '/founder-cms') {
      return;
    }

    const trackView = async () => {
      try {
        const sessionKey = 'sc_session_recorded';
        const isNewSession = !window.sessionStorage.getItem(sessionKey);
        const trafficRef = doc(db, 'site_analytics', 'traffic');
        const snap = await getDoc(trafficRef);

        if (!snap.exists()) {
          await setDoc(trafficRef, {
            totalPageViews: 1,
            uniqueSessions: 1,
            lastPath: currentPath,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            trafficRef,
            {
              totalPageViews: increment(1),
              uniqueSessions: isNewSession ? increment(1) : snap.data().uniqueSessions || 1,
              lastPath: currentPath,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (isNewSession) {
          window.sessionStorage.setItem(sessionKey, '1');
        }
      } catch {
        // Silently ignore analytics write failures so UX is never disrupted
      }
    };

    const timer = window.setTimeout(trackView, 800);
    return () => window.clearTimeout(timer);
  }, [currentPath]);

  return {
    siteConfig,
    banners,
    announcements,
    events,
    approvedFeedback,
    loading,
  };
}
