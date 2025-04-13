import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { SocialPostSuggestions } from '@/components/SocialPostSuggestions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageMetaTags from '@/components/LanguageMetaTags';
import MainLayout from '@/layouts/MainLayout';

export default function SocialMediaSuggestionsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [userIdInput, setUserIdInput] = useState('1'); // Default user ID
  const [businessType, setBusinessType] = useState('small business');
  const [currentUserId, setCurrentUserId] = useState('1');
  const [currentBusinessType, setCurrentBusinessType] = useState('small business');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUserId(userIdInput);
    setCurrentBusinessType(businessType);
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Social Media Post Suggestions | Elevion</title>
        <meta name="description" content="AI-powered social media post suggestions for your business" />
        <meta name="robots" content="index,follow" />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags currentPath="/social-media-suggestions" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold">Social Media Post Suggestions</h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered social media content ideas tailored to your business
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
                <CardDescription>Customize the suggestions for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input 
                      id="userId" 
                      value={userIdInput} 
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="Enter user ID"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input 
                      id="businessType" 
                      value={businessType} 
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g., restaurant, retail, consulting"
                    />
                    <p className="text-xs text-muted-foreground">
                      Specify your business type for more relevant suggestions
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Generate Suggestions
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Effective Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Keep your captions concise and engaging</li>
                    <li>Include a clear call-to-action</li>
                    <li>Use relevant hashtags (2-5 per post)</li>
                    <li>Post at peak times for your audience</li>
                    <li>Include high-quality visuals</li>
                    <li>Ask questions to boost engagement</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <SocialPostSuggestions 
              userId={currentUserId} 
              businessType={currentBusinessType}
            />
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this Feature</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    The Social Media Post Suggestions feature uses Elevion's xAI integration to generate 
                    engaging, personalized content ideas for your social media platforms. These suggestions
                    are optimized for engagement and based on industry best practices.
                  </p>
                  <p className="mt-2">
                    This tool is designed to save you time and boost your social media presence by providing
                    ready-to-use content tailored to your specific business needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}