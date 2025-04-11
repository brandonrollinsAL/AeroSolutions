import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { CheckCircle } from "lucide-react";
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

const SubscriptionPlans: React.FC = () => {
  // Fetch subscription plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['/api/subscriptions/plans'],
    refetchOnWindowFocus: false,
  });

  // Handle subscribe action
  const handleSubscribe = async (planId: number) => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to subscribe to a plan",
          variant: "destructive",
        });
        return;
      }

      // Redirect to subscription page with plan ID
      window.location.href = `/subscription/checkout?planId=${planId}`;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to process subscription request",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2 mb-4" />
              
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      {plans?.data?.map((plan: any) => (
        <Card key={plan.id} className="flex flex-col transition-all duration-300 hover:shadow-lg border-opacity-50 hover:border-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-xl font-bold text-primary">{plan.name}</CardTitle>
              {plan.isPopular && (
                <Badge variant="secondary" className="ml-2">
                  Most Popular
                </Badge>
              )}
            </div>
            <CardDescription className="text-2xl font-bold">
              ${parseFloat(plan.price).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-3">
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
          <CardFooter className="pt-4">
            <Button 
              className="w-full" 
              variant={plan.isPopular ? "default" : "outline"}
              onClick={() => handleSubscribe(plan.id)}
            >
              Subscribe Now
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlans;