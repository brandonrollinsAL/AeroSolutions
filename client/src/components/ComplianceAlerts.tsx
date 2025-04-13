import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Severity badge variants
const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">{severity}</Badge>;
    case 'violation':
      return <Badge variant="destructive" className="bg-red-600">{severity}</Badge>;
    case 'warning':
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400">{severity}</Badge>;
    case 'info':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-400">{severity}</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
};

// Category badge variants
const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'us_law':
      return <Badge className="bg-indigo-600">US Law</Badge>;
    case 'gdpr':
      return <Badge className="bg-emerald-600">GDPR</Badge>;
    case 'google_guidelines':
      return <Badge className="bg-teal-600">Google Guidelines</Badge>;
    case 'content_policy':
      return <Badge className="bg-purple-600">Content Policy</Badge>;
    case 'advertising_standards':
      return <Badge className="bg-orange-600">Advertising Standards</Badge>;
    case 'privacy':
      return <Badge className="bg-sky-600">Privacy</Badge>;
    case 'security':
      return <Badge className="bg-red-600">Security</Badge>;
    case 'intellectual_property':
      return <Badge className="bg-pink-600">Intellectual Property</Badge>;
    case 'data_protection':
      return <Badge className="bg-blue-600">Data Protection</Badge>;
    case 'accessibility':
      return <Badge className="bg-yellow-600">Accessibility</Badge>;
    default:
      return <Badge>{category}</Badge>;
  }
};

// Status badge variants
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-red-500">{status}</Badge>;
    case 'resolved':
      return <Badge className="bg-green-500">{status}</Badge>;
    case 'acknowledged':
      return <Badge className="bg-blue-500">{status}</Badge>;
    case 'false_positive':
      return <Badge className="bg-gray-500">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export interface ComplianceAlertItem {
  id: number;
  scanId: number;
  contentId: string;
  contentType: string;
  contentTitle: string;
  category: string;
  severity: string;
  description: string;
  suggestedAction: string;
  relatedRegulation: string | null;
  excerpt: string | null;
  status: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface ComplianceStats {
  totalScans: number;
  openAlerts: number;
  alertsBySeverity: { severity: string; count: number }[];
  alertsByCategory: { category: string; count: number }[];
  recentFailedScans: any[];
}

export default function ComplianceAlerts() {
  const { toast } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlertItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');

  // Fetch alerts
  const { 
    data: alerts, 
    isLoading: alertsLoading, 
    isError: alertsError 
  } = useQuery({
    queryKey: ['/api/compliance/alerts/recent'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/compliance/alerts/recent');
      return await res.json() as ComplianceAlertItem[];
    }
  });

  // Fetch compliance stats
  const { 
    data: stats, 
    isLoading: statsLoading, 
    isError: statsError 
  } = useQuery({
    queryKey: ['/api/compliance/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/compliance/stats');
      return await res.json() as ComplianceStats;
    }
  });

  // Update alert status mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, status, resolutionNotes }: { 
      alertId: number; 
      status: string; 
      resolutionNotes?: string;
    }) => {
      const res = await apiRequest('PATCH', `/api/compliance/alerts/${alertId}/status`, {
        status,
        resolutionNotes
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alert updated',
        description: 'The compliance alert status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/alerts/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/stats'] });
      setDialogOpen(false);
      setSelectedAlert(null);
      setResolution('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update the alert status.',
        variant: 'destructive',
      });
    }
  });

  const handleOpenDialog = (alert: ComplianceAlertItem) => {
    setSelectedAlert(alert);
    setNewStatus('resolved');
    setResolution(alert.resolutionNotes || '');
    setDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedAlert) return;
    
    updateAlertMutation.mutate({
      alertId: selectedAlert.id,
      status: newStatus,
      resolutionNotes: resolution
    });
  };

  if (alertsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading compliance data...</span>
      </div>
    );
  }

  if (alertsError || statsError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded text-red-800">
        Failed to load compliance alerts. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                AI-detected potential compliance issues with US laws, GDPR, and Google guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <Table>
                  <TableCaption>Recent compliance alerts requiring attention</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-xs truncate">{alert.contentTitle}</div>
                          <div className="text-xs text-muted-foreground">{alert.contentType}</div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(alert.category)}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>{new Date(alert.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(alert)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-md">
                  <p>No compliance alerts found. Your content is looking good!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Statistics</CardTitle>
              <CardDescription>
                Overview of legal and regulatory compliance across your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Alerts Overview</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-sm text-muted-foreground">Total Scans</div>
                        <div className="text-2xl font-bold">{stats.totalScans}</div>
                      </div>
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-sm text-muted-foreground">Open Alerts</div>
                        <div className="text-2xl font-bold">{stats.openAlerts}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">By Severity</h3>
                    <div className="space-y-2">
                      {stats.alertsBySeverity.map((item) => (
                        <div key={item.severity} className="flex justify-between items-center">
                          <div className="flex items-center">
                            {getSeverityBadge(item.severity)}
                          </div>
                          <div className="font-medium">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-secondary/20 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-lg font-medium mb-2">By Regulation Category</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {stats.alertsByCategory.map((item) => (
                        <div key={item.category} className="flex justify-between items-center bg-white p-2 rounded shadow">
                          <div className="flex items-center">
                            {getCategoryBadge(item.category)}
                          </div>
                          <div className="font-medium">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Alert details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Compliance Alert 
              {selectedAlert && (
                <>
                  {getSeverityBadge(selectedAlert.severity)}
                  {getCategoryBadge(selectedAlert.category)}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Review and update the status of this compliance alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Content</h3>
                  <p className="text-sm">{selectedAlert.contentTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: {selectedAlert.contentType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Created</h3>
                  <p className="text-sm">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {getStatusBadge(selectedAlert.status)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Suggested Action</h3>
                <p className="text-sm">{selectedAlert.suggestedAction}</p>
              </div>
              
              {selectedAlert.relatedRegulation && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Related Regulation</h3>
                  <p className="text-sm">{selectedAlert.relatedRegulation}</p>
                </div>
              )}
              
              {selectedAlert.excerpt && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Content Excerpt</h3>
                  <div className="text-sm bg-muted p-2 rounded max-h-32 overflow-y-auto">
                    {selectedAlert.excerpt}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Update Status</h3>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Resolution Notes</h3>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Add notes about how this issue was resolved..."
                  className="min-h-24"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              disabled={updateAlertMutation.isPending} 
              onClick={handleUpdateStatus}
            >
              {updateAlertMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}