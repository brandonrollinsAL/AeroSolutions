import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import MainLayout from '@/layouts/MainLayout';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import PaymentForm from '@/components/PaymentForm';

// Create a mutable reference for Stripe promise
let stripePromise: Promise<Stripe | null> | null = null;

// Function to load Stripe with publishable key from the server
const getStripePromise = async () => {
  if (!stripePromise) {
    // Fetch the publishable key from the server
    const response = await fetch('/api/stripe/config');
    const { publishableKey } = await response.json();
    
    // Initialize Stripe with the fetched key
    stripePromise = loadStripe(publishableKey, {
      locale: 'en',
    });
  }
  return stripePromise;
};

const SubscriptionCheckoutPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get('planId');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  // Fetch plan details
  const { data: planData, isLoading, error } = useQuery({
    queryKey: [`/api/subscriptions/plans/${planId}`],
    enabled: !!planId,
    refetchOnWindowFocus: false,
  });
  
  const plan = planData?.data;

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      setLocation('/login?redirect=/subscriptions');
    }
  }, [setLocation]);

  // Initialize Stripe when component mounts
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripe = await getStripePromise();
        setStripeInstance(stripe);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        setErrorMessage('Failed to initialize payment system. Please try again later.');
      }
    };
    
    initializeStripe();
  }, []);

  // Create payment intent when plan is loaded
  useEffect(() => {
    if (plan && !clientSecret && !isSubmitting) {
      setIsSubmitting(true);
      
      const createSubscription = async () => {
        try {
          const response = await apiRequest('/api/subscriptions/subscribe', {
            method: 'POST',
            body: JSON.stringify({ planId: parseInt(planId || '0', 10) }),
          });
          
          if (response.success && response.data?.clientSecret) {
            setClientSecret(response.data.clientSecret);
          } else {
            setErrorMessage('Failed to create subscription. Please try again.');
          }
        } catch (error) {
          console.error('Error creating subscription:', error);
          setErrorMessage('An error occurred while setting up your subscription.');
        } finally {
          setIsSubmitting(false);
        }
      };
      
      createSubscription();
    }
  }, [plan, clientSecret, planId, isSubmitting]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast({
      title: "Subscription Successful!",
      description: "Your subscription has been processed successfully.",
    });
    
    // Redirect to dashboard or subscription confirmation page
    setTimeout(() => {
      setLocation('/account');
    }, 2000);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl">
          <Skeleton className="h-10 w-2/3 mb-6" />
          <Skeleton className="h-6 w-full mb-10" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              
              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !plan) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Error Loading Subscription Plan</h1>
          <p className="mb-6">We couldn't find the subscription plan you're looking for.</p>
          <Button onClick={() => setLocation('/subscriptions')}>
            Return to Subscriptions
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (errorMessage) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Subscription Error</h1>
          <p className="mb-6">{errorMessage}</p>
          <Button onClick={() => setLocation('/subscriptions')}>
            Return to Subscriptions
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Subscribe to {plan.name} | Aero Solutions</title>
        <meta 
          name="description" 
          content={`Complete your subscription to the ${plan.name} plan and unlock premium aviation features.`} 
        />
      </Helmet>

      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
        <p className="text-muted-foreground mb-8">You're just one step away from accessing premium features.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">{plan.name}</CardTitle>
              <CardDescription className="text-2xl font-bold">
                ${parseFloat(plan.price).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{plan.description}</p>
              <div className="space-y-2 mt-4">
                {plan.features?.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            {clientSecret && stripeInstance ? (
              <Elements stripe={stripeInstance} options={{ clientSecret }}>
                <PaymentForm 
                  onSuccess={handlePaymentSuccess}
                  amount={parseFloat(plan.price)}
                  interval={plan.interval}
                  clientSecret={clientSecret}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Preparing payment form...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SubscriptionCheckoutPage;