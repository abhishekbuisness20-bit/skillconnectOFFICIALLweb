/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { AppRoute, normalizePath, syncRouteMetadata } from './utils/seoRouting';
import { useCMSData } from './hooks/useCMSData';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ActivityDispatchModal } from './components/ActivityDispatchModal';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ServicesPage } from './pages/ServicesPage';
import { ShowcasePage } from './pages/ShowcasePage';
import { LaunchPage } from './pages/LaunchPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPages } from './pages/LegalPages';
import { WorkspacePage } from './pages/WorkspacePage';
import { FounderCMSPage } from './pages/FounderCMSPage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [activityModal, setActivityModal] = useState<{
    isOpen: boolean;
    actionType: string;
    targetFeature: string;
  }>({
    isOpen: false,
    actionType: '',
    targetFeature: '',
  });

  const { siteConfig, banners, announcements, events, approvedFeedback } = useCMSData(currentRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    syncRouteMetadata(
      currentRoute,
      siteConfig.seo?.homeTitle,
      siteConfig.seo?.homeDescription
    );
  }, [currentRoute, siteConfig.seo?.homeTitle, siteConfig.seo?.homeDescription]);

  const navigate = (route: AppRoute) => {
    if (route !== currentRoute) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openActivityModal = (actionType: string, targetFeature: string) => {
    setActivityModal({ isOpen: true, actionType, targetFeature });
  };

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return (
          <HomePage
            siteConfig={siteConfig}
            banners={banners}
            approvedFeedback={approvedFeedback}
            onNavigate={navigate}
            onOpenActivityModal={openActivityModal}
          />
        );
      case '/about':
        return <AboutPage siteConfig={siteConfig} onNavigate={navigate} />;
      case '/features':
        return (
          <FeaturesPage
            siteConfig={siteConfig}
            onNavigate={navigate}
            onOpenActivityModal={openActivityModal}
          />
        );
      case '/services':
        return (
          <ServicesPage
            siteConfig={siteConfig}
            onOpenActivityModal={openActivityModal}
          />
        );
      case '/showcase':
        return <ShowcasePage onNavigate={navigate} />;
      case '/launch':
        return <LaunchPage siteConfig={siteConfig} events={events} onNavigate={navigate} />;
      case '/feedback':
        return <FeedbackPage siteConfig={siteConfig} approvedFeedback={approvedFeedback} />;
      case '/contact':
        return <ContactPage siteConfig={siteConfig} />;
      case '/workspace':
        return <WorkspacePage onNavigate={navigate} />;
      case '/privacy':
      case '/terms':
      case '/disclaimer':
      case '/deletion':
        return (
          <LegalPages
            route={currentRoute}
            supportEmail={siteConfig.contact.supportEmail}
            onNavigate={navigate}
          />
        );
      case '/founder-cms':
        return <FounderCMSPage />;
      default:
        return (
          <HomePage
            siteConfig={siteConfig}
            banners={banners}
            approvedFeedback={approvedFeedback}
            onNavigate={navigate}
            onOpenActivityModal={openActivityModal}
          />
        );
    }
  };

  return (
    <ErrorBoundary onResetRoute={() => navigate('/')}>
      <AuthProvider>
        <Layout
          currentRoute={currentRoute}
          onNavigate={navigate}
          announcements={announcements}
          supportEmail={siteConfig.contact.supportEmail}
        >
          {renderPage()}
        </Layout>

        <ActivityDispatchModal
          isOpen={activityModal.isOpen}
          actionType={activityModal.actionType}
          targetFeature={activityModal.targetFeature}
          onClose={() => setActivityModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
