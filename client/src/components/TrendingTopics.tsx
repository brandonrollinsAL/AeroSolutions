import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Lightbulb, TrendingUp, PlusCircle, X } from 'lucide-react';

interface TrendingTopicsProps {
  defaultIndustry?: string;
  defaultKeywords?: string[];
}

const TrendingTopics = ({ 
  defaultIndustry = 'web development', 
  defaultKeywords = ['web design', 'marketing', 'automation'] 
}: TrendingTopicsProps) => {
  const [topics, setTopics] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [industry, setIndustry] = useState<string>(defaultIndustry);
  const [keywords, setKeywords] = useState<string[]>(defaultKeywords);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const { toast } = useToast();

  // Predefined keyword sets for different tabs
  const keywordSets = {
    technology: ['web development', 'ai', 'cloud', 'cybersecurity'],
    marketing: ['seo', 'social media', 'content marketing', 'email'],
    ecommerce: ['online store', 'payment processing', 'inventory', 'shipping'],
    finance: ['accounting', 'bookkeeping', 'taxes', 'payroll']
  };

  const fetchTrendingTopics = async (targetIndustry: string, targetKeywords: string[]) => {
    if (!targetKeywords.length) {
      toast({
        title: "No keywords selected",
        description: "Please add at least one keyword to generate trending topics",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/content/trending-topics', {
        keywords: targetKeywords,
        industry: targetIndustry
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.trendingTopics);
      } else {
        toast({
          title: "Error fetching topics",
          description: data.message || "Unable to fetch trending topics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      toast({
        title: "Connection Error",
        description: "Unable to fetch trending topics. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics(industry, keywords);
  }, []);

  const handleKeywordAdd = () => {
    if (!newKeyword.trim()) return;
    
    if (keywords.includes(newKeyword.toLowerCase().trim())) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword is already in your list",
      });
      return;
    }
    
    setKeywords([...keywords, newKeyword.toLowerCase().trim()]);
    setNewKeyword('');
  };

  const handleKeywordRemove = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeywordSetChange = (tab: string) => {
    setKeywords(keywordSets[tab as keyof typeof keywordSets] || []);
  };

  const handleSubmit = () => {
    fetchTrendingTopics(industry, keywords);
  };

  const formatTopics = (topicsText: string): JSX.Element => {
    // Parse markdown-like format into structured components
    const sections = topicsText.split(/###\s+\d+\.\s+/).filter(Boolean);
    
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n').filter(Boolean);
          
          // Extract title (without the leading ** which we'll remove)
          const titleLine = lines[0];
          const title = titleLine.replace(/\*\*/g, '').trim();
          
          // Extract description and relevance
          const descLine = lines.find(l => l.includes('Brief Description:'))?.replace('- **Brief Description:**', '').trim() || '';
          const relevanceLine = lines.find(l => l.includes('Why It\'s Relevant Now:'))?.replace('- **Why It\'s Relevant Now:**', '').trim() || '';
          
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-slate-100 dark:bg-slate-800">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Description:</span>
                    <p className="text-slate-700 dark:text-slate-300">{descLine}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Why it's relevant:</span>
                    <p className="text-slate-700 dark:text-slate-300">{relevanceLine}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <Badge variant="outline">Topic {index + 1}</Badge>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Lightbulb className="h-4 w-4" /> Use Idea
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics Generator</CardTitle>
          <CardDescription>
            Generate trending topic ideas based on your industry and keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="custom" onValueChange={handleKeywordSetChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="custom" className="mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Input
                    placeholder="Enter your industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Keywords</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Add a keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleKeywordAdd();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleKeywordAdd} 
                      size="sm"
                      className="gap-1"
                    >
                      <PlusCircle className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="px-2 py-1">
                        {keyword}
                        <button 
                          onClick={() => handleKeywordRemove(keyword)}
                          className="ml-1 text-slate-500 hover:text-slate-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-sm text-slate-500">No keywords added yet</span>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading || keywords.length === 0}
                  className="w-full mt-2"
                >
                  {isLoading ? 'Generating...' : 'Generate Trending Topics'}
                </Button>
              </div>
            </TabsContent>
            
            {Object.entries(keywordSets).map(([key, value]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Selected Keywords</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {value.map((keyword) => (
                        <Badge key={keyword} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => fetchTrendingTopics(industry, value)}
                    disabled={isLoading}
                    className="w-full mt-2"
                  >
                    {isLoading ? 'Generating...' : `Generate ${key.charAt(0).toUpperCase() + key.slice(1)} Topics`}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Generated Trending Topics</h3>
        
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : topics ? (
          formatTopics(topics)
        ) : (
          <Card className="p-6 text-center">
            <p className="text-slate-500">No topics generated yet. Select keywords and click the generate button above.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrendingTopics;