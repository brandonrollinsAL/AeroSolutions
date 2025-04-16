import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form validation schema
const clientInputSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  industry: z.string().min(1, { message: 'Please select an industry' }),
  designPreferences: z.object({
    colorScheme: z.string().min(1, { message: 'Please select a color scheme preference' }),
    style: z.string().min(1, { message: 'Please select a design style' }),
  }),
  projectDescription: z.string().min(10, { message: 'Please provide a brief description (min 10 characters)' }),
  contactEmail: z.string().email({ message: 'Please enter a valid email address' }),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

type ClientInputFormValues = z.infer<typeof clientInputSchema>;

/**
 * Client Input Popup Component
 * Used for collecting client input in a popup/modal window
 */
const ClientInputPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Define industries list
  const industries = [
    { value: 'ecommerce', label: 'E-Commerce' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'retail', label: 'Retail' },
    { value: 'finance', label: 'Finance' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'nonprofit', label: 'Non-Profit' },
    { value: 'other', label: 'Other' },
  ];

  // Setup form with default values
  const form = useForm<ClientInputFormValues>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: {
      businessName: '',
      industry: '',
      designPreferences: {
        colorScheme: 'modern',
        style: 'minimal',
      },
      projectDescription: '',
      contactEmail: '',
      budget: '',
      timeline: '',
    },
  });

  // Example of using TanStack Query to fetch any necessary data
  const { isLoading: isFormLoading, error: formError } = useQuery({
    queryKey: ['/api/client-input-form', popupData?.formId],
    queryFn: async () => {
      // In a real scenario, we would fetch form data from the API
      // For now, we'll just simulate a successful response
      return { 
        title: 'Client Input',
        description: 'Please provide your input for the project requirements. This information will help us tailor the experience to your needs.'
      };
    },
    // Only run if we have a formId in the popup data
    enabled: !!popupData?.formId,
  });

  // Mutation for submitting the form
  const submitMutation = useMutation({
    mutationFn: async (data: ClientInputFormValues) => {
      const response = await apiRequest('POST', '/api/client-input', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Form Submitted Successfully",
        description: "We've received your details and are generating your website mockup!",
        variant: "default",
      });
      setFormSubmitted(true);
      
      // Invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // After a short delay, close this popup and open the preview
      setTimeout(() => {
        closePopup();
        
        // If the response includes a project ID (mockup was generated successfully)
        if (response?.data?.projectId) {
          // Navigate to preview page with project ID
          navigate(`/preview/${response.data.projectId}`);
        } else if (response?.data?.id) {
          // If no project but we have client input ID, use that
          navigate(`/preview?clientInputId=${response.data.id}`);
        } else {
          // If we have no IDs to work with, just go to the homepage
          navigate('/');
        }
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Submitting Form",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ClientInputFormValues) => {
    submitMutation.mutate(data);
  };
  
  // Handle close button click
  const handleClose = () => {
    closePopup();
    navigate('/');
  };
  
  if (isFormLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#00D1D1] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (formError) {
    return (
      <div className="p-6 text-red-500">
        <p>Error loading form data. Please try again later.</p>
        <Button variant="outline" onClick={handleClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  // Show success message after form submission
  if (formSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Helmet>
          <title>Submission Success | Elevion</title>
        </Helmet>
        
        <div className="relative w-full max-w-xl rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-poppins font-bold text-slate-blue mb-2">
              Thank You for Your Submission!
            </h2>
            
            <p className="text-slate-600 mb-6">
              We've received your project details and are generating a website mockup based on your requirements.
              You'll be redirected to preview your mockup in a moment.
            </p>
            
            <Button 
              onClick={handleClose}
              className="bg-[#00D1D1] hover:bg-[#00D1D1]/90 text-white"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <Helmet>
        <title>Client Input | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-lg my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-[#3B5B9D]">
            Project Details
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="absolute right-2 top-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Please provide your business details and project requirements. This information will help us tailor the perfect solution for your needs.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry.value} value={industry.value}>
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="designPreferences.colorScheme"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Color Scheme Preference</FormLabel>
                      <div className="p-3 border rounded-md">
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="modern" id="modern" />
                            <Label htmlFor="modern" className="flex items-center">
                              <div className="ml-2 flex gap-1">
                                <span className="h-4 w-4 rounded-full bg-[#00D1D1]"></span>
                                <span className="h-4 w-4 rounded-full bg-[#3B5B9D]"></span>
                                <span className="text-sm ml-1">Modern</span>
                              </div>
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="professional" id="professional" />
                            <Label htmlFor="professional" className="flex items-center">
                              <div className="ml-2 flex gap-1">
                                <span className="h-4 w-4 rounded-full bg-[#2C3E50]"></span>
                                <span className="h-4 w-4 rounded-full bg-[#3498DB]"></span>
                                <span className="text-sm ml-1">Professional</span>
                              </div>
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vibrant" id="vibrant" />
                            <Label htmlFor="vibrant" className="flex items-center">
                              <div className="ml-2 flex gap-1">
                                <span className="h-4 w-4 rounded-full bg-[#FF7043]"></span>
                                <span className="h-4 w-4 rounded-full bg-[#7E57C2]"></span>
                                <span className="text-sm ml-1">Vibrant</span>
                              </div>
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="minimal" id="minimal" />
                            <Label htmlFor="minimal" className="flex items-center">
                              <div className="ml-2 flex gap-1">
                                <span className="h-4 w-4 rounded-full bg-[#212121]"></span>
                                <span className="h-4 w-4 rounded-full bg-[#F5F5F5]"></span>
                                <span className="text-sm ml-1">Minimal</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="designPreferences.style"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Design Style</FormLabel>
                      <div className="p-3 border rounded-md">
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="minimal" id="style-minimal" />
                            <Label htmlFor="style-minimal">Minimal</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="corporate" id="style-corporate" />
                            <Label htmlFor="style-corporate">Corporate</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="creative" id="style-creative" />
                            <Label htmlFor="style-creative">Creative</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bold" id="style-bold" />
                            <Label htmlFor="style-bold">Bold</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your project needs, goals, and any specific requirements..." 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Please provide as much detail as possible about your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Range (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under_1000">Under $1,000</SelectItem>
                          <SelectItem value="1000_5000">$1,000 - $5,000</SelectItem>
                          <SelectItem value="5000_10000">$5,000 - $10,000</SelectItem>
                          <SelectItem value="10000_20000">$10,000 - $20,000</SelectItem>
                          <SelectItem value="above_20000">Above $20,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Timeline (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent (Less than 1 week)</SelectItem>
                        <SelectItem value="short">Short-term (1-2 weeks)</SelectItem>
                        <SelectItem value="medium">Medium-term (3-4 weeks)</SelectItem>
                        <SelectItem value="long">Long-term (1-3 months)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={submitMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#00D1D1] hover:bg-[#00D1D1]/90 text-white"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Details"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

const ClientInputPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClientInputPopupContent />
    </ErrorBoundary>
  );
};

export default ClientInputPopup;