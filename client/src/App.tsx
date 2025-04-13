import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useTranslation } from 'react-i18next';

import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/not-found";
import ClientLandingPage from "@/components/ClientLandingPage";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import TermsOfService from "@/components/TermsOfService";
import SecurityPolicy from "@/components/SecurityPolicy";
import PrivacyConsentBanner from "@/components/PrivacyConsentBanner";
import LanguageMetaTags from "@/components/LanguageMetaTags";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import MarketplacePage from "@/pages/MarketplacePage";
import SubscriptionCheckoutPage from "@/pages/SubscriptionCheckoutPage";
import MarketplaceCheckoutPage from "@/pages/MarketplaceCheckoutPage";
import PremiumPage from "@/pages/PremiumPage";
import HistoryPage from "@/pages/HistoryPage";
import LoginPage from "@/pages/LoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminClientPreviewsPage from "@/pages/AdminClientPreviewsPage";

export default function App() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);

  // Listen for messages from the ClientPreviewModal
  useEffect(() => {
    const handleClientAccess = (event: CustomEvent) => {
      if (event.detail && event.detail.accessCode) {
        setAccessCode(event.detail.accessCode);
        setLocation(`/client-preview/${event.detail.accessCode}`);
      }
    };

    // @ts-ignore - Custom event
    window.addEventListener('client-access-granted', handleClientAccess);
    
    return () => {
      // @ts-ignore - Custom event
      window.removeEventListener('client-access-granted', handleClientAccess);
    };
  }, [setLocation]);

  // Track current path for analytics and SEO purposes
  useEffect(() => {
    const updateCurrentPath = () => {
      setCurrentPath(window.location.pathname);
    };

    // Initial path
    updateCurrentPath();

    // Listen for route changes
    window.addEventListener('popstate', updateCurrentPath);
    
    return () => {
      window.removeEventListener('popstate', updateCurrentPath);
    };
  }, []);

  // Add structured data for SPA navigation
  useEffect(() => {
    // Mark the page as ready for indexing after hydration
    const readyForIndexing = () => {
      if (document.querySelector('meta[name="fragment"]')) {
        const metaFragment = document.querySelector('meta[name="fragment"]');
        if (metaFragment) {
          metaFragment.setAttribute('content', 'ready');
        }
      }
    };

    readyForIndexing();
  }, [currentPath]);

  return (
    <>
      {/* Global App Metadata - applied to all routes */}
      <Helmet>
        {/* Languages support */}
        <html lang="en" />
        <meta httpEquiv="Content-Language" content="en" />
        
        {/* Essential for SPAs and search engine crawling */}
        <meta name="fragment" content="!" />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Google verification - replace with actual code when available */}
        <meta name="google-site-verification" content="verification_token" />
        
        {/* Apple specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Elevion" />
        
        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#3B5B9D" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#3B5B9D" />
        
        {/* Application manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Links for SEO */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </Helmet>
      
      {/* Add language meta tags for the current path */}
      <LanguageMetaTags currentPath={currentPath} />
      
      <Switch>
        <Route path="/">
          {() => (
            <>
              <Helmet>
                <title>{t('seo_title')}</title>
                <meta name="description" content={t('seo_description')} />
                <meta name="robots" content="index, follow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <HomePage />
            </>
          )}
        </Route>
        <Route path="/privacy-policy">
          {() => (
            <>
              <Helmet>
                <title>Privacy Policy | Elevion Web Development</title>
                <meta name="description" content="Learn about how Elevion handles your data, our privacy practices, and your rights under GDPR and other privacy regulations." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/privacy-policy" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <PrivacyPolicy />
            </>
          )}
        </Route>
        <Route path="/terms">
          {() => (
            <>
              <Helmet>
                <title>Terms of Service | Elevion Web Development</title>
                <meta name="description" content="Review Elevion's terms of service, usage policy, and legal agreement for our web development services and platforms." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/terms" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <TermsOfService />
            </>
          )}
        </Route>
        <Route path="/security">
          {() => (
            <>
              <Helmet>
                <title>Security Policy | Elevion Web Development</title>
                <meta name="description" content="Learn about Elevion's industry-leading security practices, data protection measures, and compliance with security standards." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/security" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SecurityPolicy />
            </>
          )}
        </Route>
        <Route path="/premium">
          {() => (
            <>
              <Helmet>
                <title>{t('premium_title')} | Elevion</title>
                <meta name="description" content={t('premium_desc')} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/premium" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <PremiumPage />
            </>
          )}
        </Route>
        <Route path="/history">
          {() => (
            <>
              <Helmet>
                <title>{t('history_title')} | Elevion</title>
                <meta name="description" content={t('history_intro')} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/history" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <HistoryPage />
            </>
          )}
        </Route>
        <Route path="/subscriptions">
          {() => (
            <>
              <Helmet>
                <title>{t('subscriptions')} | Elevion</title>
                <meta name="description" content="Discover premium subscription plans for web development solutions. Access advanced features, priority support, and specialized tools." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/subscriptions" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SubscriptionsPage />
            </>
          )}
        </Route>
        <Route path="/subscriptions/checkout">
          {() => (
            <>
              <Helmet>
                <title>Checkout | Elevion</title>
                <meta name="description" content="Complete your subscription purchase securely with Elevion." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SubscriptionCheckoutPage />
            </>
          )}
        </Route>
        <Route path="/marketplace">
          {() => (
            <>
              <Helmet>
                <title>{t('marketplace')} | Elevion</title>
                <meta name="description" content="Browse web development tools, extensions, and specialized solutions in our marketplace. Find the perfect tools for your website needs." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/marketplace" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MarketplacePage />
            </>
          )}
        </Route>
        <Route path="/marketplace/purchase">
          {() => (
            <>
              <Helmet>
                <title>Purchase | Aero Solutions Marketplace</title>
                <meta name="description" content="Complete your marketplace purchase securely with Aero Solutions." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MarketplaceCheckoutPage />
            </>
          )}
        </Route>
        <Route path="/client-preview/:code">
          {(params) => (
            <>
              <Helmet>
                <title>Client Project Preview | Aero Solutions Aviation Software</title>
                <meta name="description" content="Preview your custom aviation software project with our secure client access portal. Explore features, functionality, and detailed documentation." />
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href={`https://aerosolutions.dev/client-preview/${params.code}`} />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <ClientLandingPage accessCode={params.code || accessCode || ""} />
            </>
          )}
        </Route>
        <Route path="/login">
          {() => (
            <>
              <Helmet>
                <title>Login | Aero Solutions</title>
                <meta name="description" content="Log in to your Aero Solutions account to access premium features, subscriptions, and client previews." />
                <meta name="robots" content="noindex, follow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <LoginPage />
            </>
          )}
        </Route>
        <Route path="/admin">
          {() => (
            <>
              <Helmet>
                <title>Admin Dashboard | Aero Solutions</title>
                <meta name="description" content="Aero Solutions administrative dashboard for platform management." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <AdminDashboardPage />
            </>
          )}
        </Route>
        <Route path="/admin/client-previews">
          {() => (
            <>
              <Helmet>
                <title>Manage Client Previews | Admin | Aero Solutions</title>
                <meta name="description" content="Admin tool for managing client preview access codes." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <AdminClientPreviewsPage />
            </>
          )}
        </Route>
        <Route>
          {() => (
            <>
              <Helmet>
                <title>Page Not Found | Aero Solutions</title>
                <meta name="description" content="Sorry, the page you are looking for doesn't exist. Return to our homepage to explore aviation software development services." />
                <meta name="robots" content="noindex, follow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <NotFound />
            </>
          )}
        </Route>
      </Switch>
      
      {/* Privacy consent banner */}
      <PrivacyConsentBanner 
        onAccept={() => setConsentAccepted(true)} 
        onDecline={() => {
          // In a real production app, we would disable analytics and tracking
          setConsentAccepted(false);
          console.log('User declined cookie consent - tracking disabled');
        }} 
      />
      
      <Toaster />
    </>
  );
}
