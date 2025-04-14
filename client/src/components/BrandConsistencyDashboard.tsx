import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, Hammer, RotateCw, RefreshCw, Eye, Shield, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

type BrandConsistencyIssue = {
  id: number;
  type: 'color' | 'typography' | 'tone' | 'logo' | 'other';
  severity: 'low' | 'medium' | 'high';
  location: string;
  description: string;
  recommendation: string;
  canAutoFix: boolean;
  autoFixCode?: string;
  status: 'open' | 'fixed' | 'ignored';
  createdAt: string;
  updatedAt: string;
};

const BrandConsistencyDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const { data: issues, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/brand-consistency/issues', selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      const res = await apiRequest('GET', `/api/brand-consistency/issues?${params.toString()}`);
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data as BrandConsistencyIssue[];
    },
    enabled: !!user
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/brand-consistency/run-check');
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Brand Consistency Check Complete',
        description: 'The system has checked for brand consistency issues',
        variant: 'default',
      });
      
      // Refresh the issues list
      queryClient.invalidateQueries({ queryKey: ['/api/brand-consistency/issues'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Check Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/brand-consistency/issues/${id}`, { status });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Issue Updated',
        description: 'The brand consistency issue has been updated',
        variant: 'default',
      });
      
      // Refresh the issues list
      queryClient.invalidateQueries({ queryKey: ['/api/brand-consistency/issues'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const applyFixMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/brand-consistency/issues/${id}/apply-fix`);
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Auto-Fix Applied',
        description: 'The system has attempted to fix the issue automatically',
        variant: 'default',
      });
      
      // Refresh the issues list
      queryClient.invalidateQueries({ queryKey: ['/api/brand-consistency/issues'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fix Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredIssues = issues ? issues.filter(issue => 
    (selectedType === 'all' || issue.type === selectedType)
  ) : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-blue to-electric-cyan" />;
      case 'typography':
        return <span className="text-xs font-bold">Aa</span>;
      case 'tone':
        return <span className="text-xs">Tone</span>;
      case 'logo':
        return <Shield className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be logged in to view the brand consistency dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Brand Consistency Monitor</h2>
          <p className="text-muted-foreground">
            Track and resolve brand consistency issues across your website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="typography">Typography</SelectItem>
              <SelectItem value="tone">Tone</SelectItem>
              <SelectItem value="logo">Logo</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            onClick={() => runCheckMutation.mutate()}
            disabled={runCheckMutation.isPending}
          >
            {runCheckMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-2 h-4 w-4" />
            )}
            Run Check
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="fixed">Fixed</TabsTrigger>
          <TabsTrigger value="ignored">Ignored</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <IssuesList 
            issues={filteredIssues} 
            isLoading={isLoading} 
            isError={isError} 
            error={error}
            onUpdateStatus={(id, status) => updateIssueMutation.mutate({ id, status })} 
            onApplyFix={(id) => applyFixMutation.mutate(id)}
          />
        </TabsContent>
        
        <TabsContent value="open" className="mt-4">
          <IssuesList 
            issues={filteredIssues} 
            isLoading={isLoading} 
            isError={isError} 
            error={error}
            onUpdateStatus={(id, status) => updateIssueMutation.mutate({ id, status })} 
            onApplyFix={(id) => applyFixMutation.mutate(id)}
          />
        </TabsContent>
        
        <TabsContent value="fixed" className="mt-4">
          <IssuesList 
            issues={filteredIssues} 
            isLoading={isLoading} 
            isError={isError} 
            error={error}
            onUpdateStatus={(id, status) => updateIssueMutation.mutate({ id, status })} 
            onApplyFix={(id) => applyFixMutation.mutate(id)}
          />
        </TabsContent>
        
        <TabsContent value="ignored" className="mt-4">
          <IssuesList 
            issues={filteredIssues} 
            isLoading={isLoading} 
            isError={isError} 
            error={error}
            onUpdateStatus={(id, status) => updateIssueMutation.mutate({ id, status })} 
            onApplyFix={(id) => applyFixMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface IssuesListProps {
  issues: BrandConsistencyIssue[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onUpdateStatus: (id: number, status: string) => void;
  onApplyFix: (id: number) => void;
}

const IssuesList: React.FC<IssuesListProps> = ({ 
  issues, 
  isLoading, 
  isError, 
  error,
  onUpdateStatus,
  onApplyFix
}) => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading issues</AlertTitle>
        <AlertDescription>
          {error?.message || 'Failed to load brand consistency issues'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!issues.length) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>No issues found</AlertTitle>
        <AlertDescription>
          No brand consistency issues match the current filters
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-blue to-electric-cyan" />;
      case 'typography':
        return <span className="text-xs font-bold">Aa</span>;
      case 'tone':
        return <span className="text-xs">Tone</span>;
      case 'logo':
        return <Shield className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id} className={issue.status === 'fixed' ? 'opacity-70' : ''}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {getTypeIcon(issue.type)}
                  <span className="ml-2 capitalize">{issue.type}</span>
                </div>
                <Badge className={getSeverityColor(issue.severity)}>
                  {issue.severity}
                </Badge>
                <Badge className={getStatusColor(issue.status)}>
                  {issue.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {issue.status === 'open' && issue.canAutoFix && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onApplyFix(issue.id)}
                  >
                    <Hammer className="mr-1 h-4 w-4" />
                    Auto-Fix
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-lg">{issue.description}</CardTitle>
            <CardDescription>
              {issue.location}
            </CardDescription>
          </CardHeader>
          
          {expandedIssue === issue.id && (
            <>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Recommendation</h4>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </div>
                  
                  {issue.autoFixCode && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Auto-Fix Code</h4>
                      <ScrollArea className="h-[120px] rounded-md border">
                        <div className="p-4">
                          <pre className="text-xs">{issue.autoFixCode}</pre>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {new Date(issue.createdAt).toLocaleString()}</span>
                    <span>Last updated: {new Date(issue.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              
              <Separator />
              
              <CardFooter className="flex justify-between pt-4">
                {issue.status === 'open' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onUpdateStatus(issue.id, 'ignored')}
                    >
                      Ignore Issue
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => onUpdateStatus(issue.id, 'fixed')}
                    >
                      Mark as Fixed
                    </Button>
                  </>
                )}
                
                {issue.status === 'ignored' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onUpdateStatus(issue.id, 'open')}
                  >
                    Reopen Issue
                  </Button>
                )}
                
                {issue.status === 'fixed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onUpdateStatus(issue.id, 'open')}
                  >
                    Reopen Issue
                  </Button>
                )}
              </CardFooter>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};

export default BrandConsistencyDashboard;