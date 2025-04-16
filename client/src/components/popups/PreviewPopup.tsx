import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  X, Download, Monitor, Smartphone, Tablet, 
  RefreshCw, Check, ExternalLink, Code
} from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';
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
 * Preview Popup Component
 * Used for displaying website mockups in a preview window
 */
const PreviewPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeDevice, setActiveDevice] = useState<string>('desktop');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get the project ID from popupData
  const projectId = popupData?.projectId;
  const clientInputId = popupData?.clientInputId;
  
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
  
  // Handle close button click
  const handleClose = () => {
    closePopup();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-medium text-red-600 mb-4">Error Loading Preview</h3>
          <p className="text-slate-600 mb-6">
            We encountered an issue while loading the mockup. Please try again.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const project = projectData?.data;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>{project?.name || 'Preview'} | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-5xl h-[90vh] rounded-lg bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-poppins font-bold text-slate-blue">
              {project?.name || 'Website Preview'}
            </h2>
            <p className="text-sm text-slate-500">
              {project?.description || 'Preview of your website mockup'}
            </p>
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
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
        
        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t">
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
              onClick={handleClose}
            >
              Close
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
      </div>
    </div>
  );
};

const PreviewPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <PreviewPopupContent />
    </ErrorBoundary>
  );
};

export default PreviewPopup;