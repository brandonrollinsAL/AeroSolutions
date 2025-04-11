import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { FaKey, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define the form schema for validating the access code
const accessCodeSchema = z.object({
  accessCode: z.string().min(4, {
    message: 'Access code must be at least 4 characters long',
  }),
});

type AccessCodeFormData = z.infer<typeof accessCodeSchema>;

interface ClientPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClientPreviewModal: React.FC<ClientPreviewModalProps> = ({ isOpen, onClose }) => {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Set up form validation with react-hook-form and zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccessCodeFormData>({
    resolver: zodResolver(accessCodeSchema),
  });
  
  // Special code for the count of monte cristo example
  const specialAccessCode = 'countofmontecristobitch';
  const [activeTab, setActiveTab] = useState('access');
  
  // Handle form submission
  const onSubmit = async (data: AccessCodeFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Special handling for the demo access code
      if (data.accessCode.toLowerCase() === specialAccessCode) {
        // Dispatch custom event that will be handled in App.tsx
        const event = new CustomEvent('client-access-granted', {
          detail: { accessCode: specialAccessCode }
        });
        window.dispatchEvent(event);
        
        // Reset form and close modal
        reset();
        onClose();
        
        return;
      }
      
      // In a real app, you would validate this access code with your backend
      const response = await fetch('/api/preview/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: data.accessCode }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Dispatch custom event that will be handled in App.tsx
        const event = new CustomEvent('client-access-granted', {
          detail: { accessCode: data.accessCode }
        });
        window.dispatchEvent(event);
        
        // Reset form and close modal
        reset();
        onClose();
      } else {
        setSubmissionError('Invalid access code. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      setSubmissionError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle demo access button
  const handleDemoAccess = () => {
    // Dispatch custom event that will be handled in App.tsx
    const event = new CustomEvent('client-access-granted', {
      detail: { accessCode: specialAccessCode }
    });
    window.dispatchEvent(event);
    
    // Reset form and close modal
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Client Platform Preview</DialogTitle>
          <DialogDescription className="text-center">
            Enter your access code to preview your custom aviation platform
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="access" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="access">Access Code</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="access" className="py-4">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {submissionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{submissionError}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="accessCode" className="font-medium">Access Code</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="accessCode"
                      type="text"
                      className={`pl-10 ${errors.accessCode ? 'border-red-500' : ''}`}
                      placeholder="Enter your unique access code"
                      {...register('accessCode')}
                      autoComplete="off"
                    />
                  </div>
                  {errors.accessCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.accessCode.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Access Preview'
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or Use Demo
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDemoAccess}
                >
                  Try Demo Preview
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="info" className="py-4">
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaInfoCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      Client preview access codes are provided exclusively to Aero Solutions clients.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Access codes are unique to each client and project. They allow you to preview your 
                custom aviation platform during development and after completion.
              </p>
              
              <p className="text-sm text-gray-600">
                If you've lost your access code or need assistance, please contact your project 
                manager or support at <span className="text-blue-600">support@aerosolutions.dev</span>.
              </p>
              
              <div className="mt-6">
                <Button 
                  type="button" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setActiveTab('access')}
                >
                  Back to Access
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-center">
          <div className="text-xs text-center text-gray-500">
            Try demo code: <span className="font-mono text-blue-600">countofmontecristobitch</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientPreviewModal;