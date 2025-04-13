import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { 
  PageHeader, 
  PageHeaderDescription, 
  PageHeaderHeading 
} from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import SeoStrategySuggestions from '@/components/SeoStrategySuggestions';
import { Helmet } from 'react-helmet';

export default function SeoTools() {
  return (
    <MainLayout>
      <Helmet>
        <title>SEO Tools - AI-Powered SEO Optimization | Elevion</title>
        <meta 
          name="description" 
          content="Elevion's AI-powered SEO tools help small businesses optimize their websites for better search rankings. Get personalized recommendations and strategies."
        />
      </Helmet>

      <div className="container py-12 max-w-6xl">
        <PageHeader className="pb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-blue-100 text-slate-blue-700 text-sm font-medium mb-4">
            AI-Powered SEO Tools
          </div>
          <PageHeaderHeading className="mb-4">Optimize Your Online Visibility</PageHeaderHeading>
          <PageHeaderDescription>
            Leverage our AI-powered tools to analyze your website content and get actionable recommendations
            to improve your search engine rankings and attract more visitors.
          </PageHeaderDescription>
        </PageHeader>

        <Separator className="my-6" />

        <section className="py-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">SEO Strategy Suggestions</h2>
          <p className="text-slate-600 mb-6">
            Paste your website content below to receive AI-generated SEO recommendations tailored to your business.
            Our advanced analysis will help you identify opportunities to improve your search engine rankings.
          </p>
          
          <SeoStrategySuggestions />
        </section>

        <section className="py-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Why SEO Matters for Your Business</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-electric-cyan-100 text-electric-cyan-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Increased Visibility</h3>
              <p className="text-slate-600">
                Higher search rankings mean more visibility for your business. 93% of online experiences begin with a search engine.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-blue-100 text-slate-blue-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Cost-Effective Marketing</h3>
              <p className="text-slate-600">
                SEO provides one of the best ROIs in marketing. Organic search drives 53% of all website traffic.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-sunset-orange-100 text-sunset-orange-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Targeted Traffic</h3>
              <p className="text-slate-600">
                SEO brings highly relevant visitors who are actively searching for your products or services.
              </p>
            </div>
          </div>
        </section>
        
        <section className="py-8 bg-slate-50 rounded-xl p-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Elevate Your SEO Strategy with AI</h2>
          <p className="text-slate-600 mb-6">
            Our AI-powered tools don't just identify issues—they provide actionable insights tailored to your business.
            Get expert recommendations without the high cost of hiring an SEO consultant.
          </p>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Tailored keyword recommendations based on your industry and content</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Content structure recommendations to improve readability and engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Technical SEO advice for meta tags, URLs, and schema markup</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Link building strategies to boost your domain authority</span>
            </li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
}