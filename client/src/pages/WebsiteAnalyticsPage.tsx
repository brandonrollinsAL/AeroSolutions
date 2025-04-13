import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/layouts/MainLayout';
import WebsiteConversionAnalytics from '@/components/WebsiteConversionAnalytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const WebsiteAnalyticsPage = () => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    pageUrl: '',
    conversionType: 'form_submission',
    conversions: '1',
    conversionValue: '0',
    bounceRate: '0',
    visitToConversion: '0',
    source: 'direct',
    medium: 'none',
    campaign: ''
  });

  // Fetch clients (users)
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    }
  });

  const handleTestDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert numeric values
      const payload = {
        ...formData,
        clientId: parseInt(formData.clientId),
        conversions: parseInt(formData.conversions),
        conversionValue: parseFloat(formData.conversionValue),
        bounceRate: parseFloat(formData.bounceRate),
        visitToConversion: parseFloat(formData.visitToConversion)
      };
      
      const response = await apiRequest('POST', '/api/analytics/website-conversions', payload);
      
      if (!response.ok) {
        throw new Error('Failed to submit test conversion data');
      }
      
      toast({
        title: 'Test Data Submitted',
        description: 'Test conversion data has been successfully recorded.',
        variant: 'default'
      });
      
      // If the submitted client ID matches the selected client, trigger a refetch
      if (payload.clientId === selectedClientId) {
        // Force React Query to refetch
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Website Analytics | Elevion</title>
        <meta name="description" content="Real-time website analytics and conversion tracking for your business" />
      </Helmet>
      
      <div className="container mx-auto py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Website Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze website performance, engagement, and conversions
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Add Test Data</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Test Conversion Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTestDataSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client</Label>
                      <Select 
                        name="clientId" 
                        value={formData.clientId} 
                        onValueChange={(value) => handleSelectChange('clientId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {!loadingClients && clients?.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.username} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conversionType">Conversion Type</Label>
                      <Select 
                        name="conversionType" 
                        value={formData.conversionType} 
                        onValueChange={(value) => handleSelectChange('conversionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="form_submission">Form Submission</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="signup">Signup</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="quote_request">Quote Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pageUrl">Page URL</Label>
                    <Input 
                      id="pageUrl" 
                      name="pageUrl" 
                      placeholder="https://example.com/page" 
                      value={formData.pageUrl} 
                      onChange={handleFormChange} 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="conversions">Conversions</Label>
                      <Input 
                        id="conversions" 
                        name="conversions" 
                        type="number" 
                        min="1" 
                        value={formData.conversions} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conversionValue">Value ($)</Label>
                      <Input 
                        id="conversionValue" 
                        name="conversionValue" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.conversionValue} 
                        onChange={handleFormChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bounceRate">Bounce Rate (%)</Label>
                      <Input 
                        id="bounceRate" 
                        name="bounceRate" 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.01" 
                        value={formData.bounceRate} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitToConversion">Visit to Conversion (%)</Label>
                      <Input 
                        id="visitToConversion" 
                        name="visitToConversion" 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.01" 
                        value={formData.visitToConversion} 
                        onChange={handleFormChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select 
                        name="source" 
                        value={formData.source} 
                        onValueChange={(value) => handleSelectChange('source', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medium">Medium</Label>
                      <Select 
                        name="medium" 
                        value={formData.medium} 
                        onValueChange={(value) => handleSelectChange('medium', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="organic">Organic</SelectItem>
                          <SelectItem value="cpc">CPC</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="display">Display</SelectItem>
                          <SelectItem value="affiliate">Affiliate</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign (optional)</Label>
                    <Input 
                      id="campaign" 
                      name="campaign" 
                      placeholder="Campaign name" 
                      value={formData.campaign} 
                      onChange={handleFormChange} 
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit">Submit Test Data</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Select value={selectedClientId?.toString() || ''} onValueChange={(value) => setSelectedClientId(parseInt(value))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {!loadingClients && clients?.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-6">
          {selectedClientId ? (
            <Tabs defaultValue="conversions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="conversions">Conversions</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversions">
                <WebsiteConversionAnalytics clientId={selectedClientId} />
              </TabsContent>
              
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Website Performance Analytics</CardTitle>
                    <CardDescription>
                      View load times, response metrics, and performance scores for your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center space-y-4">
                        <Badge variant="outline" className="mb-2">Coming Soon</Badge>
                        <h3 className="text-xl font-medium">Performance Analytics Dashboard</h3>
                        <p className="text-muted-foreground max-w-md">
                          Detailed performance metrics including page load times, time to first byte (TTFB),
                          Core Web Vitals, and more will be available in this dashboard soon.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-medium">Select a Client</h3>
                  <p className="text-muted-foreground max-w-md">
                    Please select a client from the dropdown menu to view their website analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default WebsiteAnalyticsPage;