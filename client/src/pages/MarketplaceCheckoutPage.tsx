import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import MainLayout from '@/layouts/MainLayout';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentForm from '@/components/PaymentForm';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const MarketplaceCheckoutPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const itemId = searchParams.get('itemId');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch item details
  const { data: itemData, isLoading, error } = useQuery({
    queryKey: [`/api/marketplace/${itemId}`],
    enabled: !!itemId,
    refetchOnWindowFocus: false,
  });
  
  const item = itemData?.data;

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase marketplace items",
        variant: "destructive",
      });
      setLocation('/login?redirect=/marketplace');
    }
  }, [setLocation]);

  // Calculate total price
  const totalPrice = item ? parseFloat(item.price) * quantity : 0;

  // Create payment intent
  const handleCreatePaymentIntent = async () => {
    if (!item || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('/api/marketplace/purchase', {
        method: 'POST',
        body: JSON.stringify({ 
          itemId: parseInt(itemId || '0', 10),
          quantity 
        }),
      });
      
      if (response.success && response.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
      } else {
        setErrorMessage('Failed to create payment intent. Please try again.');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setErrorMessage('An error occurred while setting up your purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast({
      title: "Purchase Successful!",
      description: "Your order has been processed successfully.",
    });
    
    // Redirect to orders or marketplace
    setTimeout(() => {
      setLocation('/account/orders');
    }, 2000);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl">
          <Skeleton className="h-10 w-2/3 mb-6" />
          <Skeleton className="h-6 w-full mb-10" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full rounded-md mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-6 w-1/3" />
              </CardFooter>
            </Card>
            
            <div>
              <Skeleton className="h-8 w-1/2 mb-6" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-2/3 mb-6" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !item) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Error Loading Item</h1>
          <p className="mb-6">We couldn't find the marketplace item you're looking for.</p>
          <Button onClick={() => setLocation('/marketplace')}>
            Return to Marketplace
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (errorMessage) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Purchase Error</h1>
          <p className="mb-6">{errorMessage}</p>
          <Button onClick={() => setLocation('/marketplace')}>
            Return to Marketplace
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Purchase {item.name} | Aero Solutions</title>
        <meta 
          name="description" 
          content={`Complete your purchase of ${item.name} from the Aero Solutions aviation marketplace.`} 
        />
      </Helmet>

      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
        <p className="text-muted-foreground mb-8">Just a few more steps to complete your order.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{item.name}</CardTitle>
            </CardHeader>
            {item.images && item.images.length > 0 && (
              <CardContent className="pt-0">
                <div className="h-40 overflow-hidden rounded-md">
                  <img 
                    src={item.images[0]} 
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-muted-foreground mt-4 text-sm">{item.description}</p>
              </CardContent>
            )}
            <CardFooter className="flex justify-between">
              <div className="text-lg font-bold text-primary">
                ${parseFloat(item.price).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Category: {item.category}
              </div>
            </CardFooter>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            {!clientSecret ? (
              <>
                <div className="mb-4">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="99"
                      className="rounded-none text-center"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-md mb-6">
                  <div className="flex justify-between mb-2">
                    <span>Item Price</span>
                    <span>${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCreatePaymentIntent}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Preparing Checkout...
                    </>
                  ) : (
                    `Proceed to Payment - $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  onSuccess={handlePaymentSuccess}
                  amount={totalPrice}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MarketplaceCheckoutPage;