import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, RefreshCw } from "lucide-react";

interface ContentEngagementAnalysisData {
  top_performing_content: {
    most_engaging_articles: {
      title: string;
      id: number;
      category: string;
      views: number;
      shares: number;
      likes: number;
      comments: number;
      engagement_score: string;
    }[];
  };
  content_engagement_patterns: {
    category_performance: {
      strongest_categories: {
        category: string;
        avg_views: number;
        avg_shares: number;
        avg_likes: number;
        comment_activity: string;
        note: string;
      }[];
      weaker_categories: {
        category: string;
        avg_views: number;
        avg_shares: number;
        avg_likes: number;
        comment_activity: string;
        note: string;
      }[];
    };
  };
  recommendations_for_improving_engagement: {
    content_strategy: {
      suggestion: string;
      priority: string;
    }[];
    promotion_strategy: {
      suggestion: string;
      priority: string;
    }[];
  };
  social_media_platform_performance: {
    platform_insights: {
      platform: string;
      total_shares: number;
      performance: string;
      note: string;
    }[];
  };
  reader_behavior_insights: {
    view_to_engagement_ratio: string;
    time_spent_analysis: string;
    interaction_patterns: string[];
    general_observation: string;
  };
}

interface ContentEngagementResponse {
  success: boolean;
  data: any[];
  analysis: string;
  source: 'cache' | 'fresh';
  message?: string;
}

const COLORS = ['#3B5B9D', '#00D1D1', '#FF7043', '#6366F1', '#8B5CF6', '#EC4899'];

const ContentEngagementAnalytics = () => {
  const [analytics, setAnalytics] = useState<ContentEngagementAnalysisData | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'cache' | 'fresh'>('fresh');

  const fetchAnalytics = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      if (force) setRefreshing(true);
      
      const endpoint = force 
        ? '/api/content/content-engagement?refresh=true' 
        : '/api/content/content-engagement';
      
      const response = await apiRequest('GET', endpoint);
      const data: ContentEngagementResponse = await response.json();
      
      if (data.success) {
        // Parse the JSON string in the analysis field
        const parsedAnalysis = JSON.parse(data.analysis);
        setAnalytics(parsedAnalysis);
        setRawData(data.data || []);
        setDataSource(data.source);
      } else {
        setError(data.message || 'Failed to fetch content engagement analytics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics');
      console.error('Error fetching content engagement data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Helper to prepare chart data for top articles
  const prepareTopArticlesData = () => {
    if (!analytics?.top_performing_content?.most_engaging_articles) return [];
    
    return analytics.top_performing_content.most_engaging_articles.map(article => ({
      title: article.title.length > 30 ? article.title.substring(0, 27) + '...' : article.title,
      category: article.category,
      views: article.views,
      shares: article.shares,
      likes: article.likes,
      comments: article.comments,
      id: article.id
    }));
  };

  // Helper to prepare chart data for category performance
  const prepareCategoryData = () => {
    if (!analytics?.content_engagement_patterns?.category_performance) return [];
    
    const { strongest_categories, weaker_categories } = analytics.content_engagement_patterns.category_performance;
    
    return [...strongest_categories, ...weaker_categories].map(cat => ({
      category: cat.category,
      views: cat.avg_views,
      shares: cat.avg_shares,
      likes: cat.avg_likes
    }));
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Content Engagement Analytics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Content Analytics</AlertTitle>
        <AlertDescription>
          {error}
          <button 
            onClick={() => fetchAnalytics()} 
            className="ml-4 text-sm underline"
          >
            Try Again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Engagement Analytics</h2>
        <div className="flex items-center gap-2">
          <Badge variant={dataSource === 'cache' ? 'outline' : 'default'} className="h-8">
            {dataSource === 'cache' ? 'Cached Data' : 'Fresh Data'}
          </Badge>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {analytics && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Articles with highest engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareTopArticlesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#3B5B9D" />
                  <Bar dataKey="likes" name="Likes" fill="#00D1D1" />
                  <Bar dataKey="shares" name="Shares" fill="#FF7043" />
                  <Bar dataKey="comments" name="Comments" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Average engagement by content category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareCategoryData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" name="Avg Views" stroke="#3B5B9D" />
                    <Line type="monotone" dataKey="likes" name="Avg Likes" stroke="#00D1D1" />
                    <Line type="monotone" dataKey="shares" name="Avg Shares" stroke="#FF7043" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Platform Performance</CardTitle>
                <CardDescription>Share metrics across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.social_media_platform_performance?.platform_insights?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.social_media_platform_performance.platform_insights.map((platform, index) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold">{platform.platform}</h4>
                          <Badge 
                            className="font-semibold" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {platform.total_shares} shares
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{platform.performance}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No social platform data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>AI-Powered Insights</span>
                <Info className="h-4 w-4 text-slate-500" />
              </CardTitle>
              <CardDescription>
                Generated using xAI Grok to analyze your content engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recommendations">
                <TabsList className="mb-4">
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="reader">Reader Behavior</TabsTrigger>
                  <TabsTrigger value="content">Content Strategy</TabsTrigger>
                  <TabsTrigger value="promotion">Promotion Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="recommendations" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Recommendations for Improving Engagement</h3>
                    {analytics.recommendations_for_improving_engagement?.content_strategy?.map((strategy, i) => (
                      <div key={i} className="border-l-4 pl-4 py-1" style={{ borderColor: strategy.priority === 'High' ? '#FF7043' : (strategy.priority === 'Medium' ? '#00D1D1' : '#3B5B9D') }}>
                        <div className="flex gap-2 items-center mb-1">
                          <Badge variant="outline">{strategy.priority} Priority</Badge>
                        </div>
                        <p className="text-gray-700">{strategy.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="reader" className="space-y-4">
                  {analytics.reader_behavior_insights && (
                    <div className="space-y-4">
                      <div className="border-b pb-3">
                        <h3 className="font-medium text-base mb-2">View-to-Engagement Ratio</h3>
                        <p className="text-gray-700">{analytics.reader_behavior_insights.view_to_engagement_ratio}</p>
                      </div>
                      <div className="border-b pb-3">
                        <h3 className="font-medium text-base mb-2">Time Spent Analysis</h3>
                        <p className="text-gray-700">{analytics.reader_behavior_insights.time_spent_analysis}</p>
                      </div>
                      <div className="border-b pb-3">
                        <h3 className="font-medium text-base mb-2">Interaction Patterns</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {analytics.reader_behavior_insights.interaction_patterns.map((pattern, i) => (
                            <li key={i} className="text-gray-700">{pattern}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium text-base mb-2">General Observation</h3>
                        <p className="text-gray-700">{analytics.reader_behavior_insights.general_observation}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-base mb-2">Best Performing Categories</h3>
                    {analytics.content_engagement_patterns?.category_performance?.strongest_categories.map((category, i) => (
                      <div key={i} className="border p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold">{category.category}</h4>
                          <Badge className="bg-green-500">{category.comment_activity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{category.note}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Avg Views:</span> {category.avg_views}
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Shares:</span> {category.avg_shares}
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Likes:</span> {category.avg_likes}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <h3 className="font-medium text-base mb-2 mt-4">Categories Needing Improvement</h3>
                    {analytics.content_engagement_patterns?.category_performance?.weaker_categories.map((category, i) => (
                      <div key={i} className="border p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold">{category.category}</h4>
                          <Badge variant="outline">{category.comment_activity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{category.note}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Avg Views:</span> {category.avg_views}
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Shares:</span> {category.avg_shares}
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Likes:</span> {category.avg_likes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="promotion" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Promotion Strategy Recommendations</h3>
                    {analytics.recommendations_for_improving_engagement?.promotion_strategy?.map((strategy, i) => (
                      <div key={i} className="border-l-4 pl-4 py-1" style={{ borderColor: strategy.priority === 'High' ? '#FF7043' : (strategy.priority === 'Medium' ? '#00D1D1' : '#3B5B9D') }}>
                        <div className="flex gap-2 items-center mb-1">
                          <Badge variant="outline">{strategy.priority} Priority</Badge>
                        </div>
                        <p className="text-gray-700">{strategy.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ContentEngagementAnalytics;