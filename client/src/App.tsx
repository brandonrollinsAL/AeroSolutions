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
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import MarketplacePage from "@/pages/MarketplacePage";
import SubscriptionCheckoutPage from "@/pages/SubscriptionCheckoutPage";
import MarketplaceCheckoutPage from "@/pages/MarketplaceCheckoutPage";
import PremiumPage from "@/pages/PremiumPage";
import HistoryPage from "@/pages/HistoryPage";

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
        <meta name="apple-mobile-web-app-title" content="Aero Solutions" />
        
        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#1E3A8A" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#1E3A8A" />
        
        {/* Application manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Links for SEO */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </Helmet>
      
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/privacy-policy">
          {() => (
            <>
              <Helmet>
                <title>Privacy Policy | Aero Solutions Aviation Software</title>
                <meta name="description" content="Learn about how Aero Solutions handles your data, our privacy practices, and your rights under GDPR and other privacy regulations." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://aerosolutions.dev/privacy-policy" />
              </Helmet>
              <PrivacyPolicy />
            </>
          )}
        </Route>
        <Route path="/terms">
          {() => (
            <>
              <Helmet>
                <title>Terms of Service | Aero Solutions Aviation Software</title>
                <meta name="description" content="Review Aero Solutions' terms of service, usage policy, and legal agreement for our aviation software services and platforms." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://aerosolutions.dev/terms" />
              </Helmet>
              <TermsOfService />
            </>
          )}
        </Route>
        <Route path="/security">
          {() => (
            <>
              <Helmet>
                <title>Security Policy | Aero Solutions Aviation Software</title>
                <meta name="description" content="Learn about Aero Solutions' industry-leading security practices, data protection measures, and compliance with security standards." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://aerosolutions.dev/security" />
              </Helmet>
              <SecurityPolicy />
            </>
          )}
        </Route>
        <Route path="/premium" component={PremiumPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/subscriptions" component={SubscriptionsPage} />
        <Route path="/subscriptions/checkout" component={SubscriptionCheckoutPage} />
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/marketplace/purchase" component={MarketplaceCheckoutPage} />
        <Route path="/client-preview/:code">
          {(params) => (
            <>
              <Helmet>
                <title>Client Project Preview | Aero Solutions Aviation Software</title>
                <meta name="description" content="Preview your custom aviation software project with our secure client access portal. Explore features, functionality, and detailed documentation." />
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href={`https://aerosolutions.dev/client-preview/${params.code}`} />
              </Helmet>
              <ClientLandingPage accessCode={params.code || accessCode || ""} />
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
