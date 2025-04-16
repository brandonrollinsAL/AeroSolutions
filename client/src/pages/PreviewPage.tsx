import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams, useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  X, Download, Monitor, Smartphone, Tablet, 
  RefreshCw, Check, ExternalLink, Code, ArrowLeft
} from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectData {
  id: number;
  name: string;
  description: string;
  htmlContent?: string;
  mockupHtml?: string;
  cssContent?: string;
  mockupCss?: string;
  jsContent?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PreviewDevice {
  name: string;
  width: string;
  height: string;
  icon: React.ReactNode;
}

const previewDevices: PreviewDevice[] = [
  { name: 'desktop', width: '100%', height: '100%', icon: <Monitor className="h-4 w-4" /> },
  { name: 'tablet', width: '768px', height: '1024px', icon: <Tablet className="h-4 w-4" /> },
  { name: 'mobile', width: '375px', height: '667px', icon: <Smartphone className="h-4 w-4" /> }
];

/**
 * Preview Page Component
 * Used for displaying website mockups in a dedicated page
 */
const PreviewPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeDevice, setActiveDevice] = useState<string>('desktop');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get URL parameters
  const params = useParams();
  // Route matching for /preview/:id
  const [matchProjectId, projectParams] = useRoute<{ id: string }>('/preview/:id');
  // Get query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const clientInputId = searchParams.get('clientInputId');
  
  // If direct project ID from route, use that, otherwise look for clientInputId
  const projectId = matchProjectId ? projectParams.id : null;
  
  // Use the appropriate API endpoint based on what data was provided
  const apiEndpoint = projectId 
    ? `/api/projects/${projectId}`
    : clientInputId 
      ? `/api/client-inputs/${clientInputId}/project` 
      : null;
  
  // Fetch the project data
  const { 
    isLoading: isLoadingProject, 
    error, 
    data: projectData,
    refetch
  } = useQuery<{ success: boolean, data: ProjectData }>({
    queryKey: [apiEndpoint],
    queryFn: async () => {
      if (!apiEndpoint) throw new Error('No project or client input ID provided');
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      return response.json();
    },
    enabled: !!apiEndpoint,
  });
  
  // Prepare the HTML content for the iframe
  const getIframeContent = () => {
    if (!projectData?.data) return '';
    
    const project = projectData.data;
    const html = project.htmlContent || project.mockupHtml || '';
    const css = project.cssContent || project.mockupCss || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>${css}</style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
  };
  
  // Update iframe content when project data changes
  useEffect(() => {
    if (projectData?.data && iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(getIframeContent());
        iframeDoc.close();
      }
    }
  }, [projectData]);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetch();
      toast({
        title: "Preview refreshed",
        description: "The preview has been updated with the latest changes",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh the preview at this time",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle device selection
  const handleDeviceChange = (device: string) => {
    setActiveDevice(device);
  };
  
  // Handle go back button click
  const handleBack = () => {
    navigate('/');
  };
  
  // Handle download button click
  const handleDownload = () => {
    if (!projectData?.data) return;
    
    const project = projectData.data;
    const html = project.htmlContent || project.mockupHtml || '';
    const css = project.cssContent || project.mockupCss || '';
    
    // Create a blob with the HTML content
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>${css}</style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your mockup is being downloaded",
    });
  };
  
  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-electric-cyan border-t-transparent rounded-full"></div>
            <span className="ml-3 text-slate-600">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-medium text-red-600 mb-4">Error Loading Preview</h3>
          <p className="text-slate-600 mb-6">
            We encountered an issue while loading the mockup. Please try again.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleBack}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const project = projectData?.data;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>{project?.name || 'Website Preview'} | Elevion</title>
        <meta name="description" content="Preview your custom website mockup generated by Elevion's AI-powered design system." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-xl font-poppins font-bold text-slate-blue">
                {project?.name || 'Website Preview'}
              </h1>
              <p className="text-sm text-slate-500">
                {project?.description || 'Preview of your website mockup'}
              </p>
            </div>
          </div>
          
          {/* Device selection */}
          <div className="flex items-center space-x-2">
            <div className="border rounded-md p-1 flex">
              {previewDevices.map((device) => (
                <Button
                  key={device.name}
                  variant={activeDevice === device.name ? "default" : "ghost"}
                  size="sm"
                  className={`px-2 ${activeDevice === device.name ? 'bg-electric-cyan text-white' : ''}`}
                  onClick={() => handleDeviceChange(device.name)}
                >
                  {device.icon}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className={`${showCode ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan' : ''}`}
              onClick={() => setShowCode(!showCode)}
            >
              <Code className="h-4 w-4 mr-1" />
              {showCode ? 'Hide Code' : 'View Code'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={handleRefresh}
              className="text-slate-600"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 p-6">
        <div className="container mx-auto bg-white rounded-lg shadow-md p-4 h-[calc(100vh-200px)]">
          {showCode ? (
            <Tabs defaultValue="html" className="h-full">
              <TabsList className="mb-2">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="h-[calc(100%-40px)]">
                <div className="h-full overflow-auto bg-slate-50 p-4 rounded-md border font-mono text-sm">
                  <pre>{project?.htmlContent || project?.mockupHtml || 'No HTML content available'}</pre>
                </div>
              </TabsContent>
              
              <TabsContent value="css" className="h-[calc(100%-40px)]">
                <div className="h-full overflow-auto bg-slate-50 p-4 rounded-md border font-mono text-sm">
                  <pre>{project?.cssContent || project?.mockupCss || 'No CSS content available'}</pre>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50 rounded-md overflow-auto">
              <div 
                className="preview-container transition-all duration-300 ease-in-out border border-slate-200 bg-white shadow-md overflow-hidden"
                style={{
                  width: previewDevices.find(d => d.name === activeDevice)?.width || '100%',
                  height: previewDevices.find(d => d.name === activeDevice)?.height || '100%',
                  maxHeight: '100%',
                  maxWidth: '100%'
                }}
              >
                <iframe
                  ref={iframeRef}
                  title="Website Mockup Preview"
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-4 px-6 border-t">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-slate-500">
            {project?.status === 'draft' ? (
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></span>
                Draft Preview
              </span>
            ) : (
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                {project?.status === 'processed' ? 'Processed' : project?.status || 'Ready'}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              Back to Home
            </Button>
            
            <Button 
              className="bg-electric-cyan hover:bg-electric-cyan/90 text-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function PreviewPageWrapper() {
  return (
    <ErrorBoundary>
      <PreviewPage />
    </ErrorBoundary>
  );
}