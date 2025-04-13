import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Send, Calendar, Save, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Types
interface EmailCampaignSuggestion {
  subjectLine: string;
  content: string;
  callToAction: string;
  bestTimeToSend: string;
}

interface EmailCampaign {
  id: number;
  userId: number;
  industry: string;
  campaignType: string;
  subjectLine: string;
  content: string;
  callToAction: string;
  bestTimeToSend: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Component for creating a new campaign
const NewCampaignForm = () => {
  const { toast } = useToast();
  const [industry, setIndustry] = useState('web development');
  const [campaignType, setCampaignType] = useState('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<EmailCampaignSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EmailCampaignSuggestion | null>(null);
  const [customCampaign, setCustomCampaign] = useState({
    subjectLine: '',
    content: '',
    callToAction: '',
    bestTimeToSend: ''
  });
  const [showCustomForm, setShowCustomForm] = useState(false);

  // List of industries and campaign types
  const industries = [
    'web development', 'retail', 'restaurant', 'service business', 
    'professional practice', 'healthcare', 'fitness', 'education', 
    'nonprofit', 'e-commerce', 'technology', 'real estate'
  ];
  
  const campaignTypes = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'promotional', label: 'Promotional Offer' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'reengagement', label: 'Re-engagement' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'event', label: 'Event Invitation' }
  ];

  // Get AI suggestions for email campaigns
  const getSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    setSelectedSuggestion(null);
    
    try {
      const response = await apiRequest('POST', '/api/email-campaigns/suggestions', {
        industry,
        campaignType
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        toast({
          title: "Suggestions generated",
          description: "We've generated some campaign ideas for you",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate suggestions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate campaign suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save the selected campaign
  const saveCampaign = async (campaign: EmailCampaignSuggestion) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/email-campaigns/save', {
        industry,
        campaignType,
        ...campaign
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Campaign saved",
          description: "Your email campaign has been saved as a draft",
        });
        // Reset form
        setSelectedSuggestion(null);
        setShowCustomForm(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Error",
        description: "Failed to save email campaign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Industry</label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Campaign Type</label>
          <Select value={campaignType} onValueChange={setCampaignType}>
            <SelectTrigger>
              <SelectValue placeholder="Select campaign type" />
            </SelectTrigger>
            <SelectContent>
              {campaignTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={getSuggestions} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Generate Ideas
          </Button>
        </div>
      </div>

      {/* Create custom campaign button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="w-full md:w-auto"
        >
          {showCustomForm ? "Hide Custom Form" : "Create Custom Campaign"}
        </Button>
      </div>

      {/* Custom Campaign Form */}
      {showCustomForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Campaign</CardTitle>
            <CardDescription>Design your own email campaign from scratch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Line</label>
                <Input 
                  value={customCampaign.subjectLine} 
                  onChange={(e) => setCustomCampaign({...customCampaign, subjectLine: e.target.value})}
                  placeholder="Enter compelling subject line" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email Content</label>
                <Textarea 
                  value={customCampaign.content} 
                  onChange={(e) => setCustomCampaign({...customCampaign, content: e.target.value})}
                  placeholder="Enter email content" 
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Call to Action</label>
                <Input 
                  value={customCampaign.callToAction} 
                  onChange={(e) => setCustomCampaign({...customCampaign, callToAction: e.target.value})}
                  placeholder="E.g., 'Book Now', 'Learn More'" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Best Time to Send</label>
                <Input 
                  value={customCampaign.bestTimeToSend} 
                  onChange={(e) => setCustomCampaign({...customCampaign, bestTimeToSend: e.target.value})}
                  placeholder="E.g., 'Tuesday morning', 'Friday afternoon'" 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => saveCampaign(customCampaign)} 
              disabled={isLoading || !customCampaign.subjectLine || !customCampaign.content}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Custom Campaign
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Generated Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold">AI-Generated Campaign Ideas</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all ${selectedSuggestion === suggestion ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setSelectedSuggestion(suggestion === selectedSuggestion ? null : suggestion)}
              >
                <CardHeader>
                  <CardTitle className="text-base truncate">{suggestion.subjectLine}</CardTitle>
                  <CardDescription className="text-xs">Best time: {suggestion.bestTimeToSend}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3">{suggestion.content}</p>
                  <Badge variant="outline" className="mt-2">CTA: {suggestion.callToAction}</Badge>
                </CardContent>
                {selectedSuggestion === suggestion && (
                  <CardFooter>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        saveCampaign(suggestion);
                      }} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Campaign
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for managing existing campaigns
const CampaignManager = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Fetch user campaigns
  const fetchCampaigns = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('GET', '/api/email-campaigns/user-campaigns');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch campaigns",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load your email campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update campaign status
  const updateCampaignStatus = async (id: number, status: 'draft' | 'scheduled' | 'sent', scheduleDate?: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/email-campaigns/status/${id}`, {
        status,
        scheduledDate: scheduleDate
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setCampaigns(campaigns.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status, scheduledDate: scheduleDate } 
            : campaign
        ));
        
        toast({
          title: "Campaign updated",
          description: `Campaign has been ${status === 'scheduled' ? 'scheduled' : status}`,
        });
        
        // Close dialog if open
        setShowScheduleDialog(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  // Delete campaign
  const deleteCampaign = async (id: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/email-campaigns/${id}`);
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setCampaigns(campaigns.filter(campaign => campaign.id !== id));
        
        toast({
          title: "Campaign deleted",
          description: "Your email campaign has been deleted",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete email campaign",
        variant: "destructive",
      });
    }
  };

  // Handle open schedule dialog
  const openScheduleDialog = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setScheduledDate('');
    setShowScheduleDialog(true);
  };

  // Schedule the campaign
  const scheduleCampaign = () => {
    if (selectedCampaign && scheduledDate) {
      updateCampaignStatus(selectedCampaign.id, 'scheduled', scheduledDate);
    }
  };

  // Mark campaign as sent (in a real app, this would be triggered automatically)
  const markCampaignAsSent = (id: number) => {
    updateCampaignStatus(id, 'sent');
  };

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">Create your first campaign to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{campaign.subjectLine}</CardTitle>
                    <CardDescription className="text-xs">
                      {campaign.industry} • {
                        [
                          { value: 'welcome', label: 'Welcome Email' },
                          { value: 'promotional', label: 'Promotional Offer' },
                          { value: 'newsletter', label: 'Newsletter' },
                          { value: 'announcement', label: 'Announcement' },
                          { value: 'followup', label: 'Follow-up' },
                          { value: 'reengagement', label: 'Re-engagement' },
                          { value: 'seasonal', label: 'Seasonal' },
                          { value: 'event', label: 'Event Invitation' }
                        ].find(t => t.value === campaign.campaignType)?.label || campaign.campaignType
                      }
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={
                      campaign.status === 'sent' ? 'default' : 
                      campaign.status === 'scheduled' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{campaign.content}</p>
                
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Send className="mr-1 h-3 w-3" />
                    CTA: {campaign.callToAction}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Best time: {campaign.bestTimeToSend}
                  </span>
                  {campaign.scheduledDate && (
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openScheduleDialog(campaign)}
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule
                    </Button>
                  )}
                  
                  {campaign.status === 'scheduled' && (
                    <Button 
                      size="sm" 
                      onClick={() => markCampaignAsSent(campaign.id)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Mark as Sent
                    </Button>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteCampaign(campaign.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when you want to send this email campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium mb-1">Scheduled Date</label>
            <Input 
              type="datetime-local" 
              value={scheduledDate} 
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={scheduleCampaign} disabled={!scheduledDate}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main Email Campaigns Page
const EmailCampaignsPage = () => {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <p className="text-muted-foreground mt-1">Create and manage email campaigns for your business</p>
      </div>
      
      <Tabs defaultValue="create">
        <TabsList className="mb-6">
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="manage">Manage Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <NewCampaignForm />
        </TabsContent>
        
        <TabsContent value="manage">
          <CampaignManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailCampaignsPage;