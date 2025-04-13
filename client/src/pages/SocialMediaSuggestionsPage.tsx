import React, { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SocialPostSuggestions } from '@/components/SocialPostSuggestions';
import { Helmet } from 'react-helmet';

export default function SocialMediaSuggestionsPage() {
  const [businessType, setBusinessType] = useState<string>("small business");
  
  // Using a static userId for demonstration purposes
  const userId = "demo-user";

  return (
    <MainLayout>
      <div className="container py-12 max-w-6xl">
        <div className="pb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-blue-100 text-slate-blue-700 text-sm font-medium mb-4">
            AI-Powered Social Media Tools
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Boost Your Social Media Presence</h1>
          <p className="text-xl text-slate-600 max-w-3xl">
            Generate engaging social media content for your business with our AI-powered tool.
            Get custom post suggestions optimized for engagement and visibility.
          </p>
        </div>

        <Separator className="my-6" />

        <section className="py-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="w-full md:w-1/3">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Customize Your Suggestions</h2>
                <p className="text-slate-600 mb-6">
                  Select your business type to get more relevant social media post suggestions tailored to your industry.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-type">Business Type</Label>
                    <Select
                      value={businessType}
                      onValueChange={setBusinessType}
                    >
                      <SelectTrigger id="business-type">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small business">Small Business</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="retail">Retail Store</SelectItem>
                        <SelectItem value="professional services">Professional Services</SelectItem>
                        <SelectItem value="tech startup">Tech Startup</SelectItem>
                        <SelectItem value="fitness">Fitness & Wellness</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="real estate">Real Estate</SelectItem>
                        <SelectItem value="creative">Creative Agency</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <SocialPostSuggestions userId={userId} businessType={businessType} />
            </div>
          </div>
        </section>

        <section className="py-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Why Social Media Matters for Your Business</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-electric-cyan-100 text-electric-cyan-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path>
                  <rect width="18" height="12" x="3" y="4" rx="2"></rect>
                  <line x1="10" x2="14" y1="22" y2="22"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Increased Engagement</h3>
              <p className="text-slate-600">
                Regular, high-quality posts increase brand visibility and keep your audience engaged with your business.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-blue-100 text-slate-blue-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Expand Your Audience</h3>
              <p className="text-slate-600">
                Reach new potential customers through compelling social media content that gets shared and discussed.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-sunset-orange-100 text-sunset-orange-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Build Authentic Connections</h3>
              <p className="text-slate-600">
                Create meaningful relationships with your customers through authentic, value-driven social media content.
              </p>
            </div>
          </div>
        </section>
        
        <section className="py-8 bg-slate-50 rounded-xl p-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Elevate Your Social Media Strategy with AI</h2>
          <p className="text-slate-600 mb-6">
            Our AI-powered tools provide unique, engaging content ideas tailored to your business type.
            Save time and effort while maintaining a consistent social media presence.
          </p>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Industry-specific post ideas that resonate with your target audience</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Engaging copy that encourages likes, comments, and shares</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Trending topics and hashtag suggestions to increase visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-electric-cyan-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="text-slate-700">Content ideas for multiple platforms including Instagram, Facebook, Twitter, and LinkedIn</span>
            </li>
          </ul>
        </section>

        <section className="py-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Tips for Maximizing Your Social Media Impact</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Consistency is Key</h3>
              <p className="text-slate-600">
                Maintain a regular posting schedule to keep your audience engaged. Use our AI tool to generate a batch of posts that you can schedule throughout the week.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Engage With Your Audience</h3>
              <p className="text-slate-600">
                Don't just post content—respond to comments, ask questions, and create opportunities for conversation with your followers.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Adapt to Platform Differences</h3>
              <p className="text-slate-600">
                Each social platform has its own style and audience expectations. Adjust our suggested content to fit the platform where you're posting.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Track and Analyze Results</h3>
              <p className="text-slate-600">
                Pay attention to which posts get the most engagement and use those insights to refine your social media strategy over time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}