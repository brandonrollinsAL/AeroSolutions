import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import ContentGenerator from '@/components/ContentGenerator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  FileText,
  Mail,
  Lightbulb,
  MoreVertical,
  Download,
  Copy,
  Pen,
  Trash2,
  Eye,
} from 'lucide-react';

// Content item type
interface ContentItem {
  id: string;
  title: string;
  type: 'blog_post' | 'industry_insight' | 'email_template';
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  status: 'draft' | 'published' | 'archived';
}

const ContentHubPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('generator');

  // Fetch content list
  const { data: contentList, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/list'],
    enabled: activeTab === 'library',
  });

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'blog_post':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'industry_insight':
        return <Lightbulb className="h-4 w-4 text-amber-600" />;
      case 'email_template':
        return <Mail className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format content type for display
  const formatContentType = (type: string): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Filter content based on search query
  const filteredContent = contentList?.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatContentType(item.type).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Content Hub | Elevion</title>
        <meta name="description" content="Generate and manage website content with AI assistance" />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-poppins">Content Hub</h1>
          <p className="text-gray-500 mt-1 font-lato">
            Generate, manage, and optimize your website content
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="generator">AI Content Generator</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="analytics">Content Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-6">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>
                    Manage your generated content
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search content..."
                      className="pl-9 w-full sm:w-auto min-w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredContent && filteredContent.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Words</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getContentTypeIcon(item.type)}
                              <span>{formatContentType(item.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{item.wordCount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === 'published'
                                  ? 'default'
                                  : item.status === 'draft'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pen className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" /> Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No content found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? `No content matching "${searchQuery}"`
                      : "You haven't created any content yet"}
                  </p>
                  <Button onClick={() => setActiveTab('generator')}>
                    Generate New Content
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>
                Track performance and engagement of your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="bg-blue-50 p-4 rounded-md inline-block mb-4">
                  <span className="text-blue-600">Coming soon!</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Content analytics will be available in the next update.
                  Track engagement, readability scores, and SEO performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentHubPage;