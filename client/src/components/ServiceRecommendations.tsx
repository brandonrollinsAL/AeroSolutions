import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { Link } from 'wouter';

type Recommendation = {
  id: number;
  reason: string;
  suitabilityScore: number;
};

type RecommendationResponse = {
  recommendations: Recommendation[];
  topCategories: string[];
  suggestedFeatures: string[];
  fallback?: boolean;
};

const ServiceRecommendations = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/status');
        setIsAuthenticated(response.authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketplace/recommend'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketplace/recommend');
      return response.data as RecommendationResponse;
    },
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Early return for unauthenticated users with login prompt
  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Service Recommendations</CardTitle>
          <CardDescription>
            Sign in to get AI-powered recommendations tailored to your business needs
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login">
            <Button>Sign In to See Recommendations</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Service Recommendations</CardTitle>
          <CardDescription>Finding the perfect services for your business...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Error loading recommendations';
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Service Recommendations</CardTitle>
          <CardDescription className="text-red-500">
            We couldn't load your recommendations at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  // If no recommendations available
  if (!data?.recommendations || data.recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Service Recommendations</CardTitle>
          <CardDescription>
            No recommendations available yet. Complete your profile to get tailored suggestions.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/profile">
            <Button>Update Profile</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Success state with data
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          Personalized Service Recommendations
          {data.fallback && (
            <Badge variant="outline" className="ml-2 bg-yellow-50">Basic</Badge>
          )}
        </CardTitle>
        <CardDescription>
          AI-powered suggestions based on your business profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.recommendations.map((rec) => (
          <div key={rec.id} className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium">Service #{rec.id}</h4>
              <div className="flex items-center">
                <span className="text-sm mr-1">{rec.suitabilityScore}/10</span>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{rec.reason}</p>
            <Link href={`/marketplace/${rec.id}`}>
              <Button variant="link" className="p-0 h-auto mt-2">View Details</Button>
            </Link>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-3">
        {data.topCategories.length > 0 && (
          <div>
            <span className="text-sm font-medium">Recommended Categories:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.topCategories.map((category, i) => (
                <Badge key={i} variant="secondary">{category}</Badge>
              ))}
            </div>
          </div>
        )}
        {data.suggestedFeatures.length > 0 && (
          <div>
            <span className="text-sm font-medium">Suggested Features:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.suggestedFeatures.map((feature, i) => (
                <Badge key={i} variant="outline">{feature}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceRecommendations;