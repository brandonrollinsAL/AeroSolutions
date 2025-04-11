import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FaPlus, FaSpinner, FaEye, FaEllipsisV, FaTrash, FaClipboard, FaLink, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { Shield } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import LanguageMetaTags from '@/components/LanguageMetaTags';
import { ClientCode } from '@/lib/types';

// Define form schema
const newPreviewSchema = z.object({
  clientName: z.string().min(3, 'Client name must be at least 3 characters'),
  code: z.string().min(4, 'Code must be at least 4 characters').max(50, 'Code must be less than 50 characters'),
  projectId: z.number().min(1, 'Project ID is required'),
  expiryDays: z.number().min(1, 'Expiry days must be at least 1').max(365, 'Expiry days must be less than 365'),
  notes: z.string().optional(),
});

type NewPreviewFormData = z.infer<typeof newPreviewSchema>;

export default function AdminClientPreviewsPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [clientPreviews, setClientPreviews] = useState<ClientCode[]>([]);
  const [expiredPreviews, setExpiredPreviews] = useState<ClientCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login?redirect=/admin/client-previews');
      return;
    }
    
    try {
      // Verify token has admin role
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        setLocation('/');
      }
    } catch (e) {
      localStorage.removeItem('token');
      setLocation('/login?redirect=/admin/client-previews');
    }
  }, [setLocation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewPreviewFormData>({
    resolver: zodResolver(newPreviewSchema),
    defaultValues: {
      clientName: '',
      code: '',
      projectId: 1,
      expiryDays: 30,
      notes: '',
    },
  });

  // For demo purposes only - in production this would use the API
  const loadSampleClientPreviews = () => {
    // Mock active previews
    const active: ClientCode[] = [
      {
        id: 1,
        code: 'AERO123',
        clientName: 'SkyHigh Airlines',
        projectId: 1,
        expiresAt: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
      {
        id: 2,
        code: 'EXEC456',
        clientName: 'Elite Air Charter',
        projectId: 2,
        expiresAt: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
      {
        id: 3,
        code: 'momanddad',
        clientName: 'Rollins Family Demo',
        projectId: 3,
        expiresAt: new Date(new Date().getTime() + 300 * 24 * 60 * 60 * 1000), // 300 days from now
      },
      {
        id: 4,
        code: 'demo',
        clientName: 'Monte Cristo Special Access',
        projectId: 4,
        expiresAt: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // 365 days from now
      }
    ];
    
    // Mock expired previews
    const expired: ClientCode[] = [
      {
        id: 5,
        code: 'DEMO111',
        clientName: 'Aircraft Solutions Ltd',
        projectId: 1,
        expiresAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: 6,
        code: 'PILOT999',
        clientName: 'Pilot Training Academy',
        projectId: 2,
        expiresAt: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      }
    ];
    
    setClientPreviews(active);
    setExpiredPreviews(expired);
  };
  
  useEffect(() => {
    // Simulate API fetch - in production this would be an actual API call
    loadSampleClientPreviews();
  }, []);

  const onSubmit = async (data: NewPreviewFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to create the preview
      // For demo, we'll simulate success and add to local state
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + data.expiryDays);
      
      const newPreview: ClientCode = {
        id: Math.max(...clientPreviews.map(p => p.id), 0) + 1,
        code: data.code,
        clientName: data.clientName,
        projectId: data.projectId,
        expiresAt: expiryDate,
      };
      
      // Add to state
      setClientPreviews(prev => [...prev, newPreview]);
      
      toast({
        title: 'Success',
        description: 'Client preview has been created successfully!',
      });
      
      // Reset form
      reset();
      
      // Switch to active tab to show the new preview
      setActiveTab('active');
    } catch (error) {
      console.error('Error creating preview:', error);
      setError('Failed to create client preview. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to create client preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedCode(null);
        }, 2000);
        
        toast({
          title: 'Copied!',
          description: 'Access code has been copied to clipboard',
        });
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy code. Please try again.',
          variant: 'destructive',
        });
      });
  };
  
  const handleCopyPreviewLink = (code: string) => {
    const previewUrl = `${window.location.origin}/client-preview/${code}`;
    navigator.clipboard.writeText(previewUrl)
      .then(() => {
        toast({
          title: 'Copied!',
          description: 'Preview link has been copied to clipboard',
        });
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy link. Please try again.',
          variant: 'destructive',
        });
      });
  };
  
  const handleDeletePreview = (id: number) => {
    // In a real app, this would be an API call to delete the preview
    // For demo purposes, we'll just update the state
    
    const confirmed = window.confirm('Are you sure you want to delete this client preview? This action cannot be undone.');
    
    if (!confirmed) return;
    
    // Filter out the preview from active or expired list
    if (activeTab === 'active') {
      setClientPreviews(clientPreviews.filter(preview => preview.id !== id));
    } else {
      setExpiredPreviews(expiredPreviews.filter(preview => preview.id !== id));
    }
    
    toast({
      title: 'Deleted',
      description: 'Client preview has been removed successfully',
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const daysUntilExpiry = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Manage Client Previews | Admin | Aero Solutions</title>
        <meta name="description" content="Admin dashboard to manage client preview access codes" />
        <meta name="robots" content="noindex,nofollow" />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="mr-2 h-6 w-6 text-blue-600" />
                Manage Client Previews
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage access codes for client platform previews
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/admin')}
              >
                Admin Dashboard
              </Button>
              <Button 
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('/client-preview/demo', '_blank')}
              >
                <FaEye className="mr-2 h-4 w-4" />
                Preview Example
              </Button>
            </div>
          </div>
          
          {/* Create new preview form */}
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Create New Client Preview</CardTitle>
              <CardDescription>
                Generate a new access code for client platform previews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      {...register('clientName')}
                      placeholder="Enter client organization name"
                      className={errors.clientName ? 'border-red-500' : ''}
                    />
                    {errors.clientName && (
                      <p className="text-red-500 text-sm">{errors.clientName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Access Code</Label>
                    <Input
                      id="code"
                      {...register('code')}
                      placeholder="e.g., CLIENT123"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm">{errors.code.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Project ID</Label>
                    <Input
                      id="projectId"
                      type="number"
                      {...register('projectId', { valueAsNumber: true })}
                      min="1"
                      className={errors.projectId ? 'border-red-500' : ''}
                    />
                    {errors.projectId && (
                      <p className="text-red-500 text-sm">{errors.projectId.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiryDays">Expires After (Days)</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      {...register('expiryDays', { valueAsNumber: true })}
                      min="1"
                      max="365"
                      className={errors.expiryDays ? 'border-red-500' : ''}
                    />
                    {errors.expiryDays && (
                      <p className="text-red-500 text-sm">{errors.expiryDays.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Add any additional information about this client preview"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2 h-4 w-4" />
                        Create Preview
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Client previews list */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active Previews</TabsTrigger>
                  <TabsTrigger value="expired">Expired Previews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-4">
                  {clientPreviews.length === 0 ? (
                    <div className="text-center py-8">
                      <FaInfoCircle className="mx-auto h-10 w-10 text-blue-300" />
                      <p className="mt-2 text-gray-500">No active client previews found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Code</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clientPreviews.map((preview) => (
                            <tr key={preview.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{preview.clientName}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 font-mono">{preview.code}</span>
                                  <button 
                                    onClick={() => handleCopyCode(preview.code)}
                                    className="ml-2 text-gray-400 hover:text-blue-600"
                                  >
                                    {copiedCode === preview.code ? (
                                      <FaCheck className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <FaClipboard className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{preview.projectId}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {formatDate(preview.expiresAt)}
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {daysUntilExpiry(preview.expiresAt)} days
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(`/client-preview/${preview.code}`, '_blank')}
                                  >
                                    <FaEye className="h-4 w-4" />
                                    <span className="sr-only">View Preview</span>
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <FaEllipsisV className="h-4 w-4" />
                                        <span className="sr-only">More</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleCopyPreviewLink(preview.code)}>
                                        <FaLink className="mr-2 h-4 w-4" />
                                        <span>Copy Link</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeletePreview(preview.id)} className="text-red-600">
                                        <FaTrash className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="expired" className="mt-4">
                  {expiredPreviews.length === 0 ? (
                    <div className="text-center py-8">
                      <FaInfoCircle className="mx-auto h-10 w-10 text-blue-300" />
                      <p className="mt-2 text-gray-500">No expired client previews found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Code</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expired On</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expiredPreviews.map((preview) => (
                            <tr key={preview.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{preview.clientName}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 font-mono">{preview.code}</span>
                                  <button 
                                    onClick={() => handleCopyCode(preview.code)}
                                    className="ml-2 text-gray-400 hover:text-blue-600"
                                  >
                                    {copiedCode === preview.code ? (
                                      <FaCheck className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <FaClipboard className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{preview.projectId}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {formatDate(preview.expiresAt)}
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Expired
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={() => handleDeletePreview(preview.id)}
                                >
                                  <FaTrash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}