import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, XCircle, Info, Search, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Helper for severity-based styling
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-black';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

// Helper for status-based styling
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return <Badge variant="destructive">Open</Badge>;
    case 'in_progress':
      return <Badge variant="warning">In Progress</Badge>;
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>;
    case 'closed':
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Status icon component
const StatusIcon = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case 'open':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'in_progress':
      return <Info className="h-4 w-4 text-yellow-500" />;
    case 'resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

interface BugReport {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  source: string;
  affectedComponent?: string | null;
  suggestedFix?: string | null;
  autoFixCode?: string | null;
  canAutoFix?: boolean;
  autoFixApplied?: boolean;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

interface BugDetailsProps {
  bug: BugReport;
  onStatusChange: (id: number, status: string) => void;
}

// Component to display detailed bug information
const BugDetails = ({ bug, onStatusChange }: BugDetailsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{bug.title}</h3>
          <p className="text-muted-foreground">ID: {bug.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getSeverityColor(bug.severity)}>{bug.severity}</Badge>
          {getStatusBadge(bug.status)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium">Source</h4>
          <p className="text-sm">{bug.source}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Affected Component</h4>
          <p className="text-sm">{bug.affectedComponent || 'Unknown'}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Created</h4>
          <p className="text-sm">{new Date(bug.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Last Updated</h4>
          <p className="text-sm">{new Date(bug.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium">Description</h4>
        <p className="text-sm mt-1 whitespace-pre-wrap">{bug.description}</p>
      </div>

      {bug.suggestedFix && (
        <div>
          <h4 className="text-sm font-medium">Suggested Fix</h4>
          <p className="text-sm mt-1 whitespace-pre-wrap">{bug.suggestedFix}</p>
        </div>
      )}

      {bug.autoFixCode && (
        <div className="mt-2">
          <h4 className="text-sm font-medium">Auto-Fix Code</h4>
          <div className="bg-gray-900 p-3 rounded-md mt-1 overflow-auto">
            <pre className="text-xs text-gray-100">{bug.autoFixCode}</pre>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          <Select
            defaultValue={bug.status}
            onValueChange={(value) => onStatusChange(bug.id, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {bug.canAutoFix && !bug.autoFixApplied && (
          <Button variant="outline">Apply Auto-Fix</Button>
        )}
      </div>
    </div>
  );
};

// Main bug monitoring dashboard component
const BugMonitoringDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch bug reports
  const { data: bugReports, isLoading, error } = useQuery({
    queryKey: ['/api/bug-monitoring/reports', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/api/bug-monitoring/reports' 
        : `/api/bug-monitoring/reports?status=${statusFilter}`;
      
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data.data;
    },
  });

  // Mutation for analyzing logs
  const analyzeLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/bug-monitoring/analyze-logs');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'Error logs have been analyzed successfully.',
        variant: 'default',
      });
      // Refresh the bug reports list
      queryClient.invalidateQueries({ queryKey: ['/api/bug-monitoring/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze error logs',
        variant: 'destructive',
      });
    },
  });

  // Mutation for analyzing feedback
  const analyzeFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/bug-monitoring/analyze-feedback');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'User feedback has been analyzed for potential issues.',
        variant: 'default',
      });
      // Refresh the bug reports list
      queryClient.invalidateQueries({ queryKey: ['/api/bug-monitoring/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze user feedback',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating bug status
  const updateBugStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/bug-monitoring/reports/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Bug report status has been updated successfully.',
        variant: 'default',
      });
      // Refresh the bug reports list
      queryClient.invalidateQueries({ queryKey: ['/api/bug-monitoring/reports'] });
      // Close the detail dialog
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update bug report status',
        variant: 'destructive',
      });
    },
  });

  // Handler for bug detail view
  const handleViewBugDetails = async (id: number) => {
    try {
      const response = await apiRequest('GET', `/api/bug-monitoring/reports/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedBug(data.data);
        setIsDialogOpen(true);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch bug details',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bug details',
        variant: 'destructive',
      });
    }
  };

  // Handler for status change
  const handleStatusChange = (id: number, status: string) => {
    updateBugStatusMutation.mutate({ id, status });
  };

  // If not authenticated, show sign-in message
  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bug Monitoring</CardTitle>
          <CardDescription>
            Please sign in to access bug monitoring features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Failed to load bug reports. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bug Monitoring Dashboard</CardTitle>
          <CardDescription>
            Monitor and manage application issues detected by our AI-powered system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Bug Reports</TabsTrigger>
              <TabsTrigger value="analysis">Analysis Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-between items-center my-4">
                <Select
                  defaultValue="all"
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bug-monitoring/reports'] })}>
                  Refresh
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : bugReports && bugReports.length > 0 ? (
                <Table>
                  <TableCaption>List of detected and reported bugs</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bugReports.map((bug: BugReport) => (
                      <TableRow key={bug.id}>
                        <TableCell><StatusIcon status={bug.status} /></TableCell>
                        <TableCell>{bug.title}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(bug.severity)}>{bug.severity}</Badge>
                        </TableCell>
                        <TableCell>{bug.source}</TableCell>
                        <TableCell>{new Date(bug.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBugDetails(bug.id)}
                          >
                            <Search className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ClipboardList className="h-16 w-16 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No Bug Reports Found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'There are no bug reports available. Run an analysis to detect issues.' 
                      : `There are no bug reports with status "${statusFilter}".`}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Error Log Analysis</CardTitle>
                    <CardDescription>
                      Analyze error logs to automatically detect bugs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Our XAI-powered system will analyze error logs to detect patterns and potential bugs.
                      This process may take a few moments to complete.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => analyzeLogsMutation.mutate()}
                      disabled={analyzeLogsMutation.isPending}
                    >
                      {analyzeLogsMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span> Analyzing...
                        </>
                      ) : 'Start Analysis'}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Feedback Analysis</CardTitle>
                    <CardDescription>
                      Analyze user feedback to identify potential issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Our AI will analyze recent user feedback to identify potential bugs and issues
                      that may not be captured in error logs.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => analyzeFeedbackMutation.mutate()}
                      disabled={analyzeFeedbackMutation.isPending}
                    >
                      {analyzeFeedbackMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span> Analyzing...
                        </>
                      ) : 'Analyze Feedback'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bug details dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bug Report Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected bug report
            </DialogDescription>
          </DialogHeader>
          
          {selectedBug && (
            <BugDetails 
              bug={selectedBug}
              onStatusChange={handleStatusChange}
            />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BugMonitoringDashboard;