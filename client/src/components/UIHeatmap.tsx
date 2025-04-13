import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HeatmapPoint = {
  x: number;
  y: number;
  value: number;
};

type UIElement = {
  id: string;
  selector: string;
  interactionCount: number;
  avgDwellTime: number;
  errorRate?: number;
  pageUrl: string;
};

const UIHeatmap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('clicks');

  // Fetch heatmap data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/ux/interactions-heatmap', pageFilter, viewMode],
    enabled: true,
  });

  // Fetch available pages for filtering
  const { data: pagesData } = useQuery({
    queryKey: ['/api/ux/pages'],
    enabled: true,
  });

  useEffect(() => {
    if (!data || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match container with pixel ratio adjustment
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw heatmap based on data
    const points: HeatmapPoint[] = data.points || [];
    const maxValue = Math.max(...points.map(p => p.value), 1);
    
    // Draw each point using a gaussian gradient
    points.forEach(point => {
      const radius = Math.max(20, Math.min(60, point.value / maxValue * 60));
      const alpha = Math.min(0.8, Math.max(0.1, point.value / maxValue));
      
      // Choose color based on view mode
      let color: string;
      if (viewMode === 'clicks') {
        color = `rgba(255, 59, 48, ${alpha})`;  // Red for clicks
      } else if (viewMode === 'errors') {
        color = `rgba(255, 149, 0, ${alpha})`;  // Orange for errors
      } else {
        color = `rgba(52, 199, 89, ${alpha})`;  // Green for dwell time
      }
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Draw the point
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
    
    // Draw page screenshot as background (if present)
    if (data.screenshotUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.globalAlpha = 1.0;
      };
      img.src = data.screenshotUrl;
    }
  }, [data, viewMode]);

  // Get most interactive elements
  const mostInteractiveElements = data?.topElements || [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Failed to load heatmap data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {pagesData?.pages?.map((page: string) => (
                <SelectItem key={page} value={page}>{page}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-[360px]">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
              <TabsTrigger value="dwell">Dwell Time</TabsTrigger>
              <TabsTrigger value="errors">Error Rate</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          Generate New Screenshot
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Interaction Heatmap {pageFilter !== 'all' ? `- ${pageFilter}` : ''}
              </CardTitle>
              <CardDescription>
                Visual representation of user interaction {viewMode === 'clicks' ? 'clicks' : 
                  viewMode === 'dwell' ? 'dwell time' : 'form errors'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden"
              >
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full"
                />
                {(!data || !data.points || data.points.length === 0) && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No interaction data available for the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Top Interactive Elements</CardTitle>
              <CardDescription>
                Elements with highest user engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mostInteractiveElements.length > 0 ? (
                <div className="space-y-4">
                  {mostInteractiveElements.map((element: UIElement) => (
                    <div key={element.id} className="flex flex-col space-y-1 p-3 bg-muted rounded-md">
                      <div className="font-medium truncate" title={element.selector}>
                        {element.selector}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {element.pageUrl}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <div className="font-medium">{element.interactionCount}</div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div>
                          <div className="font-medium">{element.avgDwellTime.toFixed(1)}s</div>
                          <div className="text-xs text-muted-foreground">Avg. Time</div>
                        </div>
                        <div>
                          <div className="font-medium">{element.errorRate ? `${(element.errorRate * 100).toFixed(1)}%` : 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Error Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-500">No element data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UIHeatmap;