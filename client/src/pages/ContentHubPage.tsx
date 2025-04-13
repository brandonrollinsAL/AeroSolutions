import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/MainLayout';
import BusinessContentFeed from '@/components/BusinessContentFeed';
import TrendingTopics from '@/components/TrendingTopics';
import PublishContentForm from '@/components/PublishContentForm';
import SEOHead from '@/components/SEOHead';
import { Newspaper, TrendingUp, Lightbulb, Zap, FileText } from 'lucide-react';

const ContentHubPage = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  
  const handlePublishedArticle = (article: any) => {
    setPublishedArticles((prev) => [article, ...prev]);
  };
  
  return (
    <MainLayout>
      <SEOHead
        title="Content Hub | Elevion - Smart Business Content"
        description="Access AI-powered business insights, trending topics, and personalized content recommendations for small business owners."
        keywords="business content, AI insights, trending topics, small business, content recommendations"
      />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Elevion Content Hub
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Access real-time business insights, trending topics, and content recommendations powered by advanced AI analysis.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardContent className="p-6">
              <Tabs 
                defaultValue="insights" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-8">
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    <span>Business Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Trending Topics</span>
                  </TabsTrigger>
                  <TabsTrigger value="publish" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Publish Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Recommendations</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="insights" className="mt-0">
                  <BusinessContentFeed title="Latest Business Insights" />
                </TabsContent>
                
                <TabsContent value="trending" className="mt-0">
                  <TrendingTopics />
                </TabsContent>
                
                <TabsContent value="publish" className="mt-0">
                  <PublishContentForm onPublish={handlePublishedArticle} />
                </TabsContent>
                
                <TabsContent value="recommendations" className="mt-0">
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 mx-auto text-primary mb-4" />
                    <h3 className="text-2xl font-bold mb-3">Personalized Recommendations</h3>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                      Get content tailored to your specific business needs. Sign in to view your personalized recommendations.
                    </p>
                    <Button size="lg" className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Sign in for Recommendations
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Business Insights
                </CardTitle>
                <CardDescription>
                  AI-filtered content from various sources
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-600">
                <p>Our AI analyzes and filters content to bring you the most relevant business insights, filtering out noise and highlighting what matters.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Topics
                </CardTitle>
                <CardDescription>
                  Generate topics based on keywords
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-600">
                <p>Get ahead of the curve with AI-generated trending topics tailored to your industry and interests. Perfect for planning your content strategy.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Publish Content
                </CardTitle>
                <CardDescription>
                  Generate full articles from brief notes
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-600">
                <p>Transform your ideas, bullet points, or rough drafts into polished blog articles using our AI content expansion and publishing tools.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized content for your business
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-600">
                <p>Our recommendation engine analyzes your preferences and behavior to suggest content that aligns with your business goals and interests.</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Unlock the Full Power of AI Content</h3>
                  <p className="text-slate-600">
                    Upgrade to our premium plan to access unlimited content generation, advanced topic research, and personalized business recommendations.
                  </p>
                </div>
                <Button size="lg" className="whitespace-nowrap">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ContentHubPage;