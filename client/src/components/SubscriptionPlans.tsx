import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, CheckCircle, ArrowRight } from "lucide-react";

const SubscriptionPlans: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Fetch subscription plans data
  const { data: plansData, isLoading, error } = useQuery({
    queryKey: ['/api/subscriptions/plans'],
    refetchOnWindowFocus: false,
  });

  // Handle subscription
  const handleSubscribe = (planId: number) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login with return URL
      setLocation(`/login?redirect=/subscriptions/checkout?planId=${planId}`);
      return;
    }
    
    // If user is logged in, go to checkout
    setLocation(`/subscriptions/checkout?planId=${planId}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col h-full">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-7 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-6 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-bold text-red-500">Error Loading Plans</h3>
        <p className="mt-2">Failed to fetch subscription plans. Please try again later.</p>
      </div>
    );
  }

  const plans = plansData?.data || [];

  if (plans.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-medium">No Plans Available</h3>
        <p className="mt-2 text-muted-foreground">Subscription plans are currently unavailable. Please check back later.</p>
      </div>
    );
  }

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => 
    parseFloat(a.price) - parseFloat(b.price)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {sortedPlans.map((plan: any) => (
        <Card 
          key={plan.id} 
          className={`flex flex-col h-full transition-all duration-300 hover:shadow-lg
            ${plan.isPopular ? 'border-primary border-2 relative' : 'border-opacity-50'}
          `}
        >
          {plan.isPopular && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3">
              <Badge className="bg-primary text-white shadow-md">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription className="flex items-baseline mt-2">
              <span className="text-3xl font-bold text-primary">${parseFloat(plan.price).toFixed(2)}</span>
              <span className="ml-1 text-sm text-muted-foreground">/{plan.interval}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
            <div className="space-y-3">
              {plan.features?.map((feature: string, i: number) => (
                <div key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSubscribe(plan.id)} 
              className="w-full group"
              variant={plan.isPopular ? "default" : "outline"}
            >
              Subscribe
              <ArrowRight className="ml-2 h-4 w-0 group-hover:w-4 transition-all" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlans;