import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, FileText, LayoutTemplate, ChevronDown, ChevronUp, Share, Copy } from 'lucide-react';

interface PublishContentFormProps {
  onPublish?: (article: any) => void;
}

const PublishContentForm = ({ onPublish }: PublishContentFormProps) => {
  const [contentItem, setContentItem] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedArticle, setPublishedArticle] = useState<any>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(true);
  const { toast } = useToast();

  const handlePublish = async () => {
    if (!contentItem.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content to publish",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      const response = await apiRequest('POST', '/api/content/publish-content', {
        contentItem,
        title: title.trim() || undefined
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Article Published",
          description: "Your content has been transformed into an article"
        });
        
        setPublishedArticle(data.article);
        
        if (onPublish) {
          onPublish(data.article);
        }
      } else {
        toast({
          title: "Publishing Failed",
          description: data.message || "Unable to publish your content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Connection Error",
        description: "Unable to publish content. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyArticle = () => {
    if (publishedArticle) {
      navigator.clipboard.writeText(publishedArticle.content);
      toast({
        title: "Copied to Clipboard",
        description: "Article content has been copied to your clipboard"
      });
    }
  };

  const renderMarkdown = (content: string) => {
    // Basic markdown rendering for preview
    // Replace headings
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    
    // Replace bold and italic
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Replace lists
    html = html
      .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>') // Numbered lists
      .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>'); // Bulleted lists
    
    // Replace links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Replace paragraphs - anything that's not already wrapped in HTML tags
    html = html.replace(/^(?!<[a-z].*?>)(.*$)/gm, function(match) {
      return match.trim() ? `<p>${match}</p>` : '';
    });
    
    return { __html: html };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI Content Publisher
          </CardTitle>
          <CardDescription>
            Transform your content into full-length blog articles with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Article Title (Optional)
              </label>
              <Input
                placeholder="Enter a title or leave blank for AI to generate one"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Content to Expand
              </label>
              <Textarea
                placeholder="Enter your content, points, or ideas to expand into a full blog article..."
                value={contentItem}
                onChange={(e) => setContentItem(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-slate-500 mt-1">
                Add bullet points, brief notes, or a rough draft. Our AI will transform it into a professional blog article.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-slate-500">
            Published with <Badge variant="outline">Elevion AI</Badge>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing || !contentItem.trim()}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Article...
              </>
            ) : (
              <>Publish Content</>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {publishedArticle && (
        <Card className="mb-6 border-primary/20">
          <CardHeader className="bg-primary/5 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{publishedArticle.title}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="ml-auto"
              >
                {isPreviewExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>By {publishedArticle.author}</span>
              <span>•</span>
              <span>{new Date(publishedArticle.publishedAt).toLocaleDateString()}</span>
              <Badge variant="outline" className="ml-2">Published</Badge>
            </div>
          </CardHeader>
          
          {isPreviewExpanded && (
            <>
              <Separator />
              <CardContent className="pt-4 pb-2">
                <div 
                  className="prose max-w-none dark:prose-invert" 
                  dangerouslySetInnerHTML={renderMarkdown(publishedArticle.content)} 
                />
              </CardContent>
              <CardFooter className="flex justify-between py-3 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-sm text-slate-500">
                  Article ID: {publishedArticle.id}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyArticle}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default PublishContentForm;