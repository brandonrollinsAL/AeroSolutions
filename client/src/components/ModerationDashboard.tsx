import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, Check, XCircle, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ModerationDashboard() {
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  // Fetch violations with filtering
  const { data: violationsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/moderation/violations', statusFilter, typeFilter, searchQuery, page],
    queryFn: async () => {
      const res = await apiRequest(
        'GET', 
        `/api/moderation/violations?status=${statusFilter}&type=${typeFilter}&search=${encodeURIComponent(searchQuery)}&page=${page}&limit=10`
      );
      return res.json();
    }
  });
  
  // Fetch violation details when a violation is selected
  const { data: violationDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/moderation/violations', selectedViolation?.id],
    queryFn: async () => {
      if (!selectedViolation?.id) return null;
      const res = await apiRequest('GET', `/api/moderation/violations/${selectedViolation.id}`);
      return res.json();
    },
    enabled: !!selectedViolation?.id
  });

  // Fetch moderation stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/moderation/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/moderation/stats');
      return res.json();
    }
  });

  const handleViewDetails = (violation: any) => {
    setSelectedViolation(violation);
    setAdminNotes(violation.adminNotes || '');
    setNewStatus(violation.status);
    setIsDetailsOpen(true);
  };

  const handleUpdateViolation = async () => {
    try {
      const res = await apiRequest('PATCH', `/api/moderation/violations/${selectedViolation.id}`, {
        status: newStatus,
        adminNotes
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Violation updated',
          description: 'The violation status has been updated successfully',
          variant: 'default'
        });
        refetch();
        setIsDetailsOpen(false);
      } else {
        throw new Error(result.message || 'Failed to update violation');
      }
    } catch (error) {
      console.error('Error updating violation:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating the violation status',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Open</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'false_positive':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">False Positive</Badge>;
      case 'escalated':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'hate_speech':
        return <Badge variant="destructive">Hate Speech</Badge>;
      case 'illegal_content':
        return <Badge variant="destructive">Illegal Content</Badge>;
      case 'violence':
        return <Badge variant="destructive">Violence</Badge>;
      case 'harassment':
        return <Badge variant="destructive">Harassment</Badge>;
      case 'spam':
        return <Badge variant="secondary">Spam</Badge>;
      case 'misleading':
        return <Badge variant="secondary">Misleading</Badge>;
      case 'inappropriate':
        return <Badge variant="secondary">Inappropriate</Badge>;
      case 'policy_violation':
        return <Badge variant="outline">Policy Violation</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading moderation data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="font-semibold text-lg mb-2">Failed to load moderation data</h3>
        <p className="text-muted-foreground">There was an error fetching the moderation violations.</p>
        <Button className="mt-4" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const violations = violationsData?.data?.violations || [];
  const pagination = violationsData?.data?.pagination || { page: 1, pages: 1 };
  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Moderation Dashboard</h2>
        
        {/* Stats Overview */}
        {statsData?.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Violations</h3>
              <p className="text-2xl font-bold">{stats.totalViolations || 0}</p>
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Scans</h3>
              <p className="text-2xl font-bold">{stats.totalScans || 0}</p>
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-muted-foreground">Open Issues</h3>
              <p className="text-2xl font-bold">{stats.statusBreakdown?.open || 0}</p>
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-muted-foreground">Resolved Issues</h3>
              <p className="text-2xl font-bold">{stats.statusBreakdown?.resolved || 0}</p>
            </div>
          </div>
        )}
        
        {/* Filters Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or content..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Content Type</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="marketplace_listing">Marketplace</SelectItem>
                <SelectItem value="blog_article">Blog Article</SelectItem>
                <SelectItem value="service_listing_name">Service Name</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="user_content">User Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Violations Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No violations found.
                  </TableCell>
                </TableRow>
              ) : (
                violations.map((violation: any) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-medium">{violation.id}</TableCell>
                    <TableCell>{violation.contentType}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{violation.contentTitle}</TableCell>
                    <TableCell>{getCategoryBadge(violation.category)}</TableCell>
                    <TableCell>{getStatusBadge(violation.status)}</TableCell>
                    <TableCell>{new Date(violation.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(violation)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Violation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>
              Review and manage content violation
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            violationDetails?.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Content Title</h3>
                    <p className="text-base">{violationDetails.data.violation.contentTitle}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Content Type</h3>
                    <p className="text-base">{violationDetails.data.violation.contentType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                    <p className="text-base">{getCategoryBadge(violationDetails.data.violation.category)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Status</h3>
                    <p className="text-base">{getStatusBadge(violationDetails.data.violation.status)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                    <p className="text-base">{new Date(violationDetails.data.violation.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-base">
                      {violationDetails.data.violation.updatedAt 
                        ? new Date(violationDetails.data.violation.updatedAt).toLocaleString() 
                        : 'Not updated'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Violation Reason</h3>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {violationDetails.data.violation.reason}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Content Excerpt</h3>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {violationDetails.data.violation.contentExcerpt}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Status</h3>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</h3>
                    <Textarea
                      placeholder="Add notes about this violation..."
                      className="min-h-[120px]"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUpdateViolation}>
              <Check className="h-4 w-4 mr-2" />
              Update Violation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}