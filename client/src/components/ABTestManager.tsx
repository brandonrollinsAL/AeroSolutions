import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Pause, TrendingUp, BarChart2, Plus, Trash, Edit } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

type ABTestVariant = {
  id: string;
  name: string;
  description?: string;
  changes: Record<string, any>;
  conversionRate?: number;
  impressions: number;
  conversions: number;
};

type ABTest = {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  elementSelector: string;
  goalType: 'click' | 'form_submit' | 'page_view' | 'custom';
  goalSelector?: string;
  startDate: string;
  endDate?: string;
  minSampleSize: number;
  confidenceLevel: number;
  variants: ABTestVariant[];
  winningVariantId?: string;
  createdAt: string;
  updatedAt: string;
};

type VariantSuggestion = {
  id: string;
  name: string;
  description: string;
  changes: Record<string, any>;
};

type VariantSuggestions = {
  testName: string;
  elementSelector: string;
  recommendedSampleSize: number;
  variants: VariantSuggestion[];
};

const ABTestManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [showNewTestForm, setShowNewTestForm] = useState(false);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [suggestedVariants, setSuggestedVariants] = useState<VariantSuggestions | null>(null);
  
  // Form state for new test creation
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    elementSelector: '',
    goalType: 'click' as const,
    goalSelector: '',
    minSampleSize: 1000,
    confidenceLevel: 0.95,
  });
  
  // Form state for variant generation
  const [variantGen, setVariantGen] = useState({
    elementType: 'button',
    goalDescription: 'increase click-through rate',
    currentVersion: 'Sign Up'
  });
  
  // Fetch all tests
  const { data: tests, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/abtesting/tests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/abtesting/tests');
      const data = await response.json();
      return data.data as ABTest[];
    }
  });
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ testId, status }: { testId: string; status: string }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/abtesting/tests/${testId}/status`,
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test status updated',
        description: 'The A/B test status has been updated successfully.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });
  
  // Analyze test mutation
  const analyzeTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await apiRequest(
        'POST',
        `/api/abtesting/tests/${testId}/analyze`
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test analysis complete',
        description: data.winningVariantId 
          ? `Analysis found a winning variant!` 
          : 'Analysis completed, but no significant winner yet.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });
  
  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      const response = await apiRequest(
        'POST',
        '/api/abtesting/tests',
        testData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test created',
        description: 'The A/B test has been created successfully.',
      });
      setShowNewTestForm(false);
      setSuggestedVariants(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Test creation failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });
  
  // Generate variants mutation
  const generateVariantsMutation = useMutation({
    mutationFn: async (data: typeof variantGen) => {
      const response = await apiRequest(
        'POST',
        '/api/abtesting/generate-variants',
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestedVariants(data.data);
      // Pre-fill new test form with generated data
      setNewTest(prev => ({
        ...prev,
        name: data.data.testName,
        elementSelector: data.data.elementSelector,
        minSampleSize: data.data.recommendedSampleSize
      }));
      toast({
        title: 'Variants generated',
        description: 'A/B test variants have been generated with AI suggestions.',
      });
      setGeneratingVariants(false);
    },
    onError: (error) => {
      toast({
        title: 'Variant generation failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setGeneratingVariants(false);
    }
  });
  
  // Filter tests based on active tab
  const filteredTests = tests?.filter(test => {
    if (activeTab === 'active') return test.status === 'running';
    if (activeTab === 'completed') return test.status === 'completed';
    if (activeTab === 'drafts') return test.status === 'draft';
    return true; // 'all' tab
  });
  
  const handleStatusChange = (testId: string, newStatus: 'draft' | 'running' | 'completed' | 'stopped') => {
    updateStatusMutation.mutate({ testId, status: newStatus });
  };
  
  const handleAnalyzeTest = (testId: string) => {
    analyzeTestMutation.mutate(testId);
  };
  
  const handleGenerateVariants = () => {
    setGeneratingVariants(true);
    generateVariantsMutation.mutate(variantGen);
  };
  
  const handleCreateTest = () => {
    if (!suggestedVariants) {
      toast({
        title: 'Missing variants',
        description: 'Please generate variants first.',
        variant: 'destructive',
      });
      return;
    }
    
    const testData = {
      ...newTest,
      variants: suggestedVariants.variants
    };
    
    createTestMutation.mutate(testData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading A/B tests...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load A/B tests. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">A/B Testing Manager</h1>
        <Button 
          onClick={() => {
            setShowNewTestForm(!showNewTestForm);
            if (!showNewTestForm) {
              setSuggestedVariants(null);
            }
          }}
        >
          {showNewTestForm ? 'Cancel' : (
            <>
              <Plus className="mr-2 h-4 w-4" /> New Test
            </>
          )}
        </Button>
      </div>
      
      {showNewTestForm ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New A/B Test</CardTitle>
            <CardDescription>
              Use AI to generate variant suggestions or create them manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="generate">
              <TabsList className="mb-4">
                <TabsTrigger value="generate">Generate with AI</TabsTrigger>
                <TabsTrigger value="manual">Manual Setup</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="elementType">Element Type</Label>
                      <Select 
                        value={variantGen.elementType}
                        onValueChange={(value) => setVariantGen(prev => ({ ...prev, elementType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select element type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="button">Button</SelectItem>
                          <SelectItem value="headline">Headline</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="call-to-action">Call to Action</SelectItem>
                          <SelectItem value="hero section">Hero Section</SelectItem>
                          <SelectItem value="pricing table">Pricing Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="goalDescription">Goal Description</Label>
                      <Input
                        id="goalDescription"
                        value={variantGen.goalDescription}
                        onChange={(e) => setVariantGen(prev => ({ ...prev, goalDescription: e.target.value }))}
                        placeholder="e.g., increase sign-ups, improve click-through rate"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="currentVersion">Current Version Content</Label>
                    <Textarea
                      id="currentVersion"
                      value={variantGen.currentVersion}
                      onChange={(e) => setVariantGen(prev => ({ ...prev, currentVersion: e.target.value }))}
                      placeholder="Enter the current text/content"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerateVariants} 
                    disabled={generatingVariants}
                    className="w-full"
                  >
                    {generatingVariants ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Variants...
                      </>
                    ) : (
                      'Generate Variant Suggestions'
                    )}
                  </Button>
                </div>
                
                {suggestedVariants && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Generated Variants</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestedVariants.variants.map(variant => (
                          <TableRow key={variant.id}>
                            <TableCell className="font-medium">{variant.name}</TableCell>
                            <TableCell>{variant.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="grid gap-4 mt-4">
                      <div>
                        <Label htmlFor="testName">Test Name</Label>
                        <Input
                          id="testName"
                          value={newTest.name}
                          onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="testDesc">Description (Optional)</Label>
                        <Textarea
                          id="testDesc"
                          value={newTest.description}
                          onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="elementSelector">Element Selector</Label>
                          <Input
                            id="elementSelector"
                            value={newTest.elementSelector}
                            onChange={(e) => setNewTest(prev => ({ ...prev, elementSelector: e.target.value }))}
                            className="mt-1"
                            placeholder="CSS selector (e.g., #signup-button)"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="goalType">Goal Type</Label>
                          <Select 
                            value={newTest.goalType}
                            onValueChange={(value: 'click' | 'form_submit' | 'page_view' | 'custom') => 
                              setNewTest(prev => ({ ...prev, goalType: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select goal type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="click">Click</SelectItem>
                              <SelectItem value="form_submit">Form Submit</SelectItem>
                              <SelectItem value="page_view">Page View</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {newTest.goalType === 'click' || newTest.goalType === 'form_submit' || newTest.goalType === 'custom' ? (
                        <div>
                          <Label htmlFor="goalSelector">Goal Selector (Optional)</Label>
                          <Input
                            id="goalSelector"
                            value={newTest.goalSelector}
                            onChange={(e) => setNewTest(prev => ({ ...prev, goalSelector: e.target.value }))}
                            className="mt-1"
                            placeholder="CSS selector for goal element"
                          />
                        </div>
                      ) : null}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minSampleSize">Minimum Sample Size</Label>
                          <Input
                            id="minSampleSize"
                            type="number"
                            value={newTest.minSampleSize}
                            onChange={(e) => setNewTest(prev => ({ ...prev, minSampleSize: parseInt(e.target.value) }))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confidenceLevel">Confidence Level</Label>
                          <Select 
                            value={newTest.confidenceLevel.toString()}
                            onValueChange={(value) => 
                              setNewTest(prev => ({ ...prev, confidenceLevel: parseFloat(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select confidence level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.90">90%</SelectItem>
                              <SelectItem value="0.95">95%</SelectItem>
                              <SelectItem value="0.99">99%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button onClick={handleCreateTest} className="mt-2">
                        Create Test
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual">
                <div className="grid gap-4">
                  <p className="text-muted-foreground">Manual test creation not implemented yet. Please use the AI generation option.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredTests && filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <Card key={test.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <Badge 
                      variant={
                        test.status === 'running' ? 'default' : 
                        test.status === 'completed' ? 'outline' : 
                        test.status === 'draft' ? 'secondary' : 'destructive'
                      }
                    >
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    <span>Element: <code>{test.elementSelector}</code></span>
                    <span className="ml-4">Goal: {test.goalType}</span>
                    {test.goalSelector && (
                      <span className="ml-4">Goal Element: <code>{test.goalSelector}</code></span>
                    )}
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {test.variants.map((variant) => (
                        <TableRow key={variant.id} className={variant.id === test.winningVariantId ? "bg-green-50 dark:bg-green-900/10" : ""}>
                          <TableCell className="font-medium flex items-center">
                            {variant.name}
                            {variant.id === test.winningVariantId && (
                              <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Winner
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{variant.impressions}</TableCell>
                          <TableCell className="text-right">{variant.conversions}</TableCell>
                          <TableCell className="text-right">
                            {variant.conversionRate !== undefined 
                              ? `${(variant.conversionRate * 100).toFixed(2)}%` 
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(test.createdAt).toLocaleDateString()}
                    {test.status === 'running' && (
                      <span className="ml-4">
                        Running since: {new Date(test.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {test.status === 'completed' && test.endDate && (
                      <span className="ml-4">
                        Completed: {new Date(test.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {test.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(test.id, 'running')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" /> Start
                      </Button>
                    )}
                    
                    {test.status === 'running' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusChange(test.id, 'stopped')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Pause className="h-4 w-4 mr-1" /> Pause
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleAnalyzeTest(test.id)}
                          disabled={analyzeTestMutation.isPending}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" /> Analyze
                        </Button>
                      </>
                    )}
                    
                    {test.status === 'stopped' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(test.id, 'running')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" /> Resume
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(test.id, 'completed')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <BarChart2 className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Tests Found</CardTitle>
                <CardDescription>
                  {activeTab === 'active' && "You don't have any active tests. Start a new test or activate a draft."}
                  {activeTab === 'completed' && "You don't have any completed tests yet."}
                  {activeTab === 'drafts' && "You don't have any draft tests. Create a new test to get started."}
                  {activeTab === 'all' && "You don't have any tests yet. Create your first A/B test to optimize your website."}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ABTestManager;