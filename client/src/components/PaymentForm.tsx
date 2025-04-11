import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: () => void;
  amount: number;
  interval?: string;
  clientSecret?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, amount, interval = 'month', clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!clientSecret) {
      setPaymentError('Payment not initialized correctly. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          // In a real app, collect these from a form
          name: 'Aero Solutions Customer',
        },
      }
    });

    if (error) {
      setPaymentError(error.message || 'An error occurred with your payment');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      onSuccess();
    } else {
      setPaymentError('Something went wrong with your payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Card Details</label>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
              className="p-3 border rounded-md"
            />
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-md mb-4">
            <div className="flex justify-between mb-1">
              <span>Subscription Amount</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Billing Interval</span>
              <span>{interval === 'month' ? 'Monthly' : 'Yearly'}</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Lock className="h-3 w-3 mr-1" />
            Your payment is secured with SSL encryption
          </div>
        </CardContent>
      </Card>
      
      {paymentError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          `Complete Subscription - $${amount.toFixed(2)}/${interval}`
        )}
      </Button>
    </form>
  );
};

export default PaymentForm;