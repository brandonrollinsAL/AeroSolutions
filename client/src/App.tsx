import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useTranslation } from 'react-i18next';
import ContentProtection from "@/components/ContentProtection";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ABTestClient from "@/components/ABTestClient";

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
import CreateMarketplaceItemPage from "@/pages/CreateMarketplaceItemPage";
import SubscriptionCheckoutPage from "@/pages/SubscriptionCheckoutPage";
import MarketplaceCheckoutPage from "@/pages/MarketplaceCheckoutPage";
import PremiumPage from "@/pages/PremiumPage";
import HistoryPage from "@/pages/HistoryPage";
import LoginPage from "@/pages/LoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminClientPreviewsPage from "@/pages/AdminClientPreviewsPage";
import ContentHubPage from "@/pages/ContentHubPage";
import AIServices from "@/pages/AIServices";
import FeedbackPage from "@/pages/FeedbackPage";
import BlogPostPage from "@/pages/BlogPostPage";
import MockupSuggestionPage from "@/pages/MockupSuggestionPage";
import SeoTools from "@/pages/SeoTools";
import MarketplaceAnalyticsPage from "@/pages/MarketplaceAnalyticsPage";
import ContentAnalyticsPage from "@/pages/ContentAnalyticsPage";
import AchievementsPage from "@/pages/achievements-page";
import MockupAnalyticsPage from "@/pages/MockupAnalyticsPage";
import SocialMediaSuggestionsPage from "@/pages/SocialMediaSuggestionsPage";
import EmailCampaignsPage from "@/pages/EmailCampaignsPage";
import DesignTools from "@/pages/DesignTools";
import WebsiteAnalyticsPage from "@/pages/WebsiteAnalyticsPage";
import MarketplaceAdGeneratorPage from "@/pages/MarketplaceAdGeneratorPage";
import SocialMediaPage from "@/pages/SocialMediaPage";
import MarketingCampaignsPage from "@/pages/MarketingCampaignsPage";
import UIAnalyticsDashboard from "@/pages/UIAnalyticsDashboard";
import OptimizedLandingPage from "@/pages/OptimizedLandingPage";
import CheckoutOptimizationPage from "@/pages/CheckoutOptimizationPage";
import PriceOptimizationPage from "@/pages/PriceOptimizationPage";
import BugMonitoringPage from "@/pages/BugMonitoringPage";
import BrandConsistencyPage from "@/pages/BrandConsistencyPage";
import TestElevateBot from "@/pages/TestElevateBot";
import ParticleBackgroundDemo from "@/pages/ParticleBackgroundDemo";

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
    <NotificationProvider>
      {/* A/B Testing Client - applied to all routes */}
      <ABTestClient />
      
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
                <title>Purchase | Elevion Marketplace</title>
                <meta name="description" content="Complete your marketplace purchase securely with Elevion." />
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
                <title>Client Project Preview | Elevion Web Development</title>
                <meta name="description" content="Preview your custom web development project with our secure client access portal. Explore features, functionality, and detailed documentation." />
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href={`https://elevion.dev/client-preview/${params.code}`} />
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
                <title>Login | Elevion</title>
                <meta name="description" content="Log in to your Elevion account to access premium features, subscriptions, and client previews." />
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
                <title>Admin Dashboard | Elevion</title>
                <meta name="description" content="Elevion administrative dashboard for platform management." />
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
                <title>Manage Client Previews | Admin | Elevion</title>
                <meta name="description" content="Admin tool for managing client preview access codes." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <AdminClientPreviewsPage />
            </>
          )}
        </Route>
        <Route path="/content-hub">
          {() => (
            <>
              <Helmet>
                <title>Content Hub | Elevion</title>
                <meta name="description" content="Access AI-powered business insights, trending topics, and personalized content recommendations for small business owners." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/content-hub" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <ContentHubPage />
            </>
          )}
        </Route>
        <Route path="/ai-services">
          {() => (
            <>
              <Helmet>
                <title>AI-Powered Services | Elevion</title>
                <meta name="description" content="Experience Elevion's AI-powered tools including personalized service recommendations, intelligent content analysis, and our ElevateBot assistant." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/ai-services" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <AIServices />
            </>
          )}
        </Route>
        <Route path="/feedback">
          {() => (
            <>
              <Helmet>
                <title>Feedback | Elevion</title>
                <meta name="description" content="Share your feedback about Elevion's web development services. Help us improve and provide better solutions for small businesses." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/feedback" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <FeedbackPage />
            </>
          )}
        </Route>
        <Route path="/blog/:postId">
          {(params) => (
            <>
              <Helmet>
                <title>Blog | Elevion</title>
                <meta name="description" content="Expert insights and knowledge from Elevion web development professionals on latest web trends, technologies, and strategies for small businesses." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={`https://elevion.dev/blog/${params.postId}`} />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <BlogPostPage />
            </>
          )}
        </Route>
        <Route path="/mockup-suggestions">
          {() => (
            <>
              <Helmet>
                <title>Free Website Design Suggestions | Elevion</title>
                <meta name="description" content="Get free AI-powered website design suggestions tailored to your business type. Receive color schemes, typography, layouts, and key features instantly." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/mockup-suggestions" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MockupSuggestionPage />
            </>
          )}
        </Route>
        <Route path="/seo-tools">
          {() => (
            <>
              <Helmet>
                <title>SEO Tools - AI-Powered SEO Optimization | Elevion</title>
                <meta name="description" content="Elevion's AI-powered SEO tools help small businesses optimize their websites for better search rankings. Get personalized recommendations and strategies." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/seo-tools" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SeoTools />
            </>
          )}
        </Route>
        <Route path="/design-tools">
          {() => (
            <>
              <Helmet>
                <title>AI Design Tools | Elevion</title>
                <meta name="description" content="Access Elevion's suite of AI-powered design tools for website color schemes, typography recommendations, branding guidelines, and layout suggestions." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/design-tools" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <DesignTools />
            </>
          )}
        </Route>
        <Route path="/social-media">
          {() => (
            <>
              <Helmet>
                <title>Social Media Manager | Elevion</title>
                <meta name="description" content="Manage, schedule, and analyze your social media content across multiple platforms with Elevion's AI-powered social media management system." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/social-media" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SocialMediaPage />
            </>
          )}
        </Route>
        <Route path="/marketing-campaigns">
          {() => (
            <>
              <Helmet>
                <title>Marketing Campaign Generator | Elevion</title>
                <meta name="description" content="Create powerful, data-driven marketing campaigns with our AI-powered campaign generator. Design emails, social posts, and full campaigns." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/marketing-campaigns" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MarketingCampaignsPage />
            </>
          )}
        </Route>
        <Route path="/optimized-landing">
          {() => (
            <>
              <Helmet>
                <title>AI-Optimized Landing Page | Elevion</title>
                <meta name="description" content="Experience our AI-powered landing page that learns from user behavior to optimize for conversions. See real-time optimization in action." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/optimized-landing" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <OptimizedLandingPage />
            </>
          )}
        </Route>
        
        <Route path="/checkout-optimization">
          {() => (
            <>
              <Helmet>
                <title>Checkout Optimization | Elevion</title>
                <meta name="description" content="Optimize your checkout process to increase conversions using AI-powered suggestions and analytics." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/checkout-optimization" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <CheckoutOptimizationPage />
            </>
          )}
        </Route>
        <Route path="/price-optimization">
          {() => (
            <>
              <Helmet>
                <title>Price Optimization | Elevion</title>
                <meta name="description" content="Optimize your subscription pricing with AI-powered market analysis and user behavior insights. Make data-driven pricing decisions." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/price-optimization" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <PriceOptimizationPage />
            </>
          )}
        </Route>
        <Route path="/bug-monitoring">
          {() => (
            <>
              <Helmet>
                <title>Bug Monitoring | Elevion</title>
                <meta name="description" content="Monitor and fix bugs in your website with our advanced bug monitoring dashboard." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/bug-monitoring" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <BugMonitoringPage />
            </>
          )}
        </Route>
        <Route path="/brand-consistency">
          {() => (
            <>
              <Helmet>
                <title>Brand Consistency Monitor | Elevion</title>
                <meta name="description" content="Track and manage brand consistency issues across your digital presence with our brand consistency monitoring dashboard." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/brand-consistency" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <BrandConsistencyPage />
            </>
          )}
        </Route>
        <Route path="/website-analytics">
          {() => (
            <>
              <Helmet>
                <title>Website Analytics | Elevion</title>
                <meta name="description" content="Track and analyze website performance, engagement metrics, and conversion rates with Elevion's AI-powered analytics platform." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/website-analytics" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <WebsiteAnalyticsPage />
            </>
          )}
        </Route>
        <Route path="/marketplace/analytics">
          {() => (
            <>
              <Helmet>
                <title>Service Analytics | Marketplace | Elevion</title>
                <meta name="description" content="Track service engagement, analyze marketplace metrics, and optimize your service offerings with real-time analytics." />
                <meta name="robots" content="noindex, follow" />
                <link rel="canonical" href="https://elevion.dev/marketplace/analytics" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MarketplaceAnalyticsPage />
            </>
          )}
        </Route>
        <Route path="/marketplace/ad-generator">
          {() => (
            <>
              <Helmet>
                <title>Ad Generator | Marketplace | Elevion</title>
                <meta name="description" content="Create compelling, AI-generated ad content for your premium marketplace listings to attract more customers and increase engagement." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/marketplace/ad-generator" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MarketplaceAdGeneratorPage />
            </>
          )}
        </Route>
        <Route path="/content/analytics">
          {() => (
            <>
              <Helmet>
                <title>Content Analytics | Elevion</title>
                <meta name="description" content="Track content performance and engagement metrics with AI-powered insights. Analyze reader behavior, social sharing patterns, and content effectiveness." />
                <meta name="robots" content="noindex, follow" />
                <link rel="canonical" href="https://elevion.dev/content/analytics" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <ContentAnalyticsPage />
            </>
          )}
        </Route>
        <Route path="/social-media-suggestions">
          {() => (
            <>
              <Helmet>
                <title>Social Media Post Suggestions | Elevion</title>
                <meta name="description" content="Get AI-powered social media post suggestions tailored to your business type to boost your online presence." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/social-media-suggestions" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <SocialMediaSuggestionsPage />
            </>
          )}
        </Route>
        <Route path="/email-campaigns">
          {() => (
            <>
              <Helmet>
                <title>Email Campaigns | Elevion</title>
                <meta name="description" content="Create and manage AI-powered email campaigns for your business with industry-specific templates and scheduling." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/email-campaigns" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <EmailCampaignsPage />
            </>
          )}
        </Route>
        <Route path="/mockups/analytics">
          {() => (
            <>
              <Helmet>
                <title>Mockup Analytics | Elevion</title>
                <meta name="description" content="Track mockup engagement and performance metrics with AI-powered insights. Analyze client interactions, feedback patterns, and design effectiveness." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://elevion.dev/mockups/analytics" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <MockupAnalyticsPage />
            </>
          )}
        </Route>
        <Route path="/achievements">
          {() => (
            <>
              <Helmet>
                <title>Your Achievements | Elevion</title>
                <meta name="description" content="Track your achievements, milestones and progress with Elevion. View rewards for completing key actions and engaging with our platform." />
                <meta name="robots" content="noindex, follow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <AchievementsPage />
            </>
          )}
        </Route>
        <Route>
          {() => (
            <>
              <Helmet>
                <title>Page Not Found | Elevion</title>
                <meta name="description" content="Sorry, the page you are looking for doesn't exist. Return to our homepage to explore our web development services." />
                <meta name="robots" content="noindex, follow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <NotFound />
            </>
          )}
        </Route>
        <Route path="/ui-analytics">
          {() => (
            <>
              <Helmet>
                <title>UI/UX Analytics | Elevion</title>
                <meta name="description" content="Analyze user interactions and improve your website's user experience with Elevion's AI-powered UI/UX analytics." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <UIAnalyticsDashboard />
            </>
          )}
        </Route>
        <Route path="/test-elevatebot">
          {() => (
            <>
              <Helmet>
                <title>Test ElevateBot | Elevion</title>
                <meta name="description" content="Testing page for ElevateBot integration." />
                <meta name="robots" content="noindex, nofollow" />
                <html lang={i18n.language.split('-')[0]} />
                <meta httpEquiv="Content-Language" content={i18n.language} />
              </Helmet>
              <TestElevateBot />
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
      
      {/* Global content protection */}
      <ContentProtection />
      <Toaster />
    </NotificationProvider>
  );
}
