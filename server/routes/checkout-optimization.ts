import { Router, Request, Response } from 'express';
import { grokApi } from '../grok';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock analytics data for checkout flow analysis
const checkoutAnalytics = {
  abandonedCarts: 68,
  completedCheckouts: 32,
  totalSessionsWithCheckoutIntent: 100,
  averageTimeOnCheckoutPage: 145, // seconds
  averageFieldsFilledBeforeAbandonment: 3.2,
  commonDropOffPoints: [
    { step: 'payment_details', dropOffCount: 28, percentOfTotal: 41.2 },
    { step: 'shipping_info', dropOffCount: 22, percentOfTotal: 32.4 },
    { step: 'review_order', dropOffCount: 12, percentOfTotal: 17.6 },
    { step: 'account_creation', dropOffCount: 6, percentOfTotal: 8.8 }
  ],
  deviceBreakdown: {
    mobile: { sessions: 55, completionRate: 25.5 }, // 55% of sessions, 25.5% completion
    desktop: { sessions: 38, completionRate: 39.5 }, // 38% of sessions, 39.5% completion
    tablet: { sessions: 7, completionRate: 42.9 } // 7% of sessions, 42.9% completion
  },
  paymentMethod: {
    creditCard: { attempts: 82, success: 65, error: 17 },
    paypal: { attempts: 12, success: 11, error: 1 },
    applePay: { attempts: 6, success: 5, error: 1 }
  }
};

// Analyze checkout flow data and provide optimization suggestions
router.get('/analyze', async (req: Request, res: Response) => {
  try {
    // In a production app, we would fetch real analytics data from the database
    // For now, we'll use mock data to simulate the analytics
    
    // Format data for AI analysis
    const analysisData = {
      analytics: checkoutAnalytics,
      currentFlow: {
        steps: [
          {
            name: 'Product Selection',
            isRequired: true
          },
          {
            name: 'Account Creation/Login',
            isRequired: true
          },
          {
            name: 'Payment Method Selection',
            isRequired: true
          },
          {
            name: 'Billing Information',
            isRequired: true,
            fields: ['name', 'email', 'address', 'city', 'state', 'zip', 'country']
          },
          {
            name: 'Shipping Information',
            isRequired: true,
            fields: ['name', 'address', 'city', 'state', 'zip', 'country']
          },
          {
            name: 'Payment Details',
            isRequired: true
          },
          {
            name: 'Order Review',
            isRequired: true
          },
          {
            name: 'Confirmation',
            isRequired: false
          }
        ]
      }
    };
    
    // Prepare the AI prompt
    const prompt = `
      Analyze the following e-commerce checkout flow data and provide specific, actionable suggestions 
      to optimize the checkout process for higher conversion rates.
      
      Current Checkout Analytics:
      - Cart Abandonment Rate: ${checkoutAnalytics.abandonedCarts}%
      - Completion Rate: ${checkoutAnalytics.completedCheckouts}%
      - Average Time on Checkout: ${checkoutAnalytics.averageTimeOnCheckoutPage} seconds
      - Average Fields Filled Before Abandonment: ${checkoutAnalytics.averageFieldsFilledBeforeAbandonment}
      
      Common Drop-off Points:
      ${checkoutAnalytics.commonDropOffPoints.map(point => 
        `- ${point.step.replace('_', ' ')}: ${point.percentOfTotal}% of abandonments`
      ).join('\n')}
      
      Device Breakdown:
      - Mobile: ${checkoutAnalytics.deviceBreakdown.mobile.sessions}% of sessions, ${checkoutAnalytics.deviceBreakdown.mobile.completionRate}% completion rate
      - Desktop: ${checkoutAnalytics.deviceBreakdown.desktop.sessions}% of sessions, ${checkoutAnalytics.deviceBreakdown.desktop.completionRate}% completion rate
      - Tablet: ${checkoutAnalytics.deviceBreakdown.tablet.sessions}% of sessions, ${checkoutAnalytics.deviceBreakdown.tablet.completionRate}% completion rate
      
      Payment Method Statistics:
      - Credit Card: ${checkoutAnalytics.paymentMethod.creditCard.attempts} attempts, ${checkoutAnalytics.paymentMethod.creditCard.success} successful, ${checkoutAnalytics.paymentMethod.creditCard.error} errors
      - PayPal: ${checkoutAnalytics.paymentMethod.paypal.attempts} attempts, ${checkoutAnalytics.paymentMethod.paypal.success} successful, ${checkoutAnalytics.paymentMethod.paypal.error} errors
      - Apple Pay: ${checkoutAnalytics.paymentMethod.applePay.attempts} attempts, ${checkoutAnalytics.paymentMethod.applePay.success} successful, ${checkoutAnalytics.paymentMethod.applePay.error} errors
      
      Current Checkout Flow:
      1. Product Selection
      2. Account Creation/Login
      3. Payment Method Selection
      4. Billing Information (7 fields)
      5. Shipping Information (6 fields)
      6. Payment Details
      7. Order Review
      8. Confirmation
      
      Based on the above data, provide 8 specific, actionable recommendations to optimize the checkout flow:
      1. Focus on reducing steps and fields
      2. Improve mobile experience
      3. Address payment friction
      4. Enhance user trust and security perception
      
      For each recommendation:
      - Provide a specific change to implement
      - Explain the reasoning with data from the analytics
      - Include implementation details for React components (if applicable)
      - Estimate the potential improvement in conversion rate
      
      Format your response as a JSON array of objects with these fields:
      - id (string)
      - title (string)
      - description (string)
      - implementation (string with HTML/JSX code if applicable)
      - impactArea (string: UI, UX, technical, copy)
      - difficulty (number 1-5)
      - estimatedConversionImprovement (string)
    `;
    
    // Use Grok API to analyze the data and generate suggestions
    const systemPrompt = `You are an expert e-commerce checkout optimization consultant with expertise in UI/UX design, Stripe integration, and React development. Your recommendations should be specific, actionable, and data-driven.`;
    
    const grokResponse = await grokApi.generateJson(prompt, systemPrompt);
    
    // If we couldn't get AI-generated suggestions, use fallback suggestions
    let optimizationSuggestions = [];
    if (!grokResponse) {
      // Fallback suggestions if AI fails
      optimizationSuggestions = [
        {
          id: uuidv4(),
          title: "Implement a One-Page Checkout",
          description: "Replace the multi-step checkout process with a single-page design that shows all required fields at once, with collapsible sections. This addresses the 41.2% drop-off at the payment details step.",
          implementation: `
// In your CheckoutPage component:
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-4">
    <Collapsible defaultOpen title="Account Information">
      {/* Email or guest checkout option */}
    </Collapsible>
    
    <Collapsible defaultOpen title="Shipping Information">
      {/* Address form fields */}
    </Collapsible>
    
    <Collapsible defaultOpen title="Payment Method">
      {/* Payment options including Card, PayPal, etc. */}
    </Collapsible>
  </div>
  
  <div className="sticky top-4 h-fit">
    <OrderSummary />
    <Button type="submit" className="w-full mt-4">Complete Purchase</Button>
  </div>
</div>
          `,
          impactArea: "UX",
          difficulty: 3,
          estimatedConversionImprovement: "+12-15%"
        },
        {
          id: uuidv4(),
          title: "Add Progress Indicator for Multi-Step Process",
          description: "Implement a clear progress bar that shows users exactly where they are in the checkout process and how many steps remain. This adds transparency and reduces abandonment anxiety.",
          implementation: `
// Create a CheckoutProgress component:
const CheckoutProgress = ({ currentStep, steps }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex flex-col items-center"
          >
            <div 
              className={\`rounded-full w-8 h-8 flex items-center justify-center \${
                index < currentStep 
                  ? "bg-primary text-white" 
                  : index === currentStep 
                    ? "bg-primary/20 border-2 border-primary text-primary" 
                    : "bg-gray-200 text-gray-500"
              }\`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span className="text-xs mt-1">{step}</span>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div 
          className="bg-primary h-2 rounded-full" 
          style={{ width: \`\${(currentStep / (steps.length - 1)) * 100}%\` }}
        />
      </div>
    </div>
  );
};
          `,
          impactArea: "UI",
          difficulty: 2,
          estimatedConversionImprovement: "+5-8%"
        },
        {
          id: uuidv4(),
          title: "Optimize Mobile Payment Form",
          description: "Create a mobile-specific payment form layout that's easier to use on small screens. Given that 55% of sessions are on mobile with only a 25.5% completion rate versus 39.5% on desktop.",
          implementation: `
// Enhance the PaymentForm component with mobile-specific styling:
const PaymentForm = ({ onSuccess, amount, interval, clientSecret }) => {
  // ...existing code

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
                    fontSize: window.innerWidth < 768 ? '18px' : '16px', // Larger font on mobile
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                    // Increase touch target size on mobile
                    padding: window.innerWidth < 768 ? '14px 12px' : '10px 12px',
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
              className="p-3 border rounded-md md:h-auto h-14" // Taller input on mobile
            />
          </div>
          
          {/* Rest of the form */}
        </CardContent>
      </Card>
      
      <Button 
        type="submit" 
        className="w-full md:h-10 h-14 text-base" // Taller button on mobile 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          \`Complete Order - \$\${amount.toFixed(2)}\${interval ? \`/\${interval}\` : ''}\`
        )}
      </Button>
    </form>
  );
};
          `,
          impactArea: "UI",
          difficulty: 2,
          estimatedConversionImprovement: "+10-18% on mobile"
        },
        {
          id: uuidv4(),
          title: "Add Guest Checkout Option",
          description: "Implement a prominent guest checkout option to eliminate the account creation barrier, which is causing 8.8% of abandonment. Include an option to create an account after purchase completion.",
          implementation: `
// Add this to the top of your checkout page:
const CheckoutOptions = ({ setCheckoutMode }) => {
  return (
    <div className="mb-6 space-y-4">
      <h2 className="text-xl font-semibold">Checkout Options</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="border-2 cursor-pointer hover:border-primary transition-all"
          onClick={() => setCheckoutMode('guest')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Guest Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Checkout quickly without creating an account
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full">Continue as Guest</Button>
          </CardFooter>
        </Card>
        
        <Card 
          className="border-2 cursor-pointer hover:border-primary transition-all"
          onClick={() => setCheckoutMode('account')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Sign in to use saved payment methods and addresses
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
          `,
          impactArea: "UX",
          difficulty: 2,
          estimatedConversionImprovement: "+6-9%"
        },
        {
          id: uuidv4(),
          title: "Implement Smart Defaults and Address Autocomplete",
          description: "Add address autocomplete functionality to reduce the number of fields users need to manually fill out. The analytics show users abandon after filling an average of 3.2 fields.",
          implementation: `
// Import libraries
import { usePlacesAutocomplete } from "use-places-autocomplete";

// Create an enhanced address input component
const AddressAutocomplete = ({ onAddressSelected }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  const handleSelect = (suggestion) => {
    setValue(suggestion.description, false);
    clearSuggestions();
    
    // Get detailed address data
    // In a real implementation, call the Google Maps API to get address details
    // and fill in other form fields automatically
    
    onAddressSelected({
      street: suggestion.description,
      city: "Example City",
      state: "CA",
      postalCode: "12345",
      country: "US"
    });
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Start typing your address..."
        className="w-full"
      />
      
      {status === "OK" && (
        <ul className="absolute z-10 bg-white w-full border rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
          {data.map(suggestion => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-secondary cursor-pointer"
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
          `,
          impactArea: "UX",
          difficulty: 3,
          estimatedConversionImprovement: "+8-12%"
        },
        {
          id: uuidv4(),
          title: "Add Alternative Payment Methods",
          description: "Prominently display multiple payment options including Apple Pay and PayPal as primary buttons, not hidden in dropdown menus. The data shows non-credit card methods have higher success rates.",
          implementation: `
// Enhanced payment method selection component
const PaymentMethodSelector = ({ onSelect, selectedMethod }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Method</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaymentOption
          id="card"
          name="Credit Card"
          icon={<CreditCard className="h-6 w-6" />}
          selected={selectedMethod === 'card'}
          onSelect={() => onSelect('card')}
        />
        
        <PaymentOption
          id="paypal"
          name="PayPal"
          icon={<SiPaypal className="h-6 w-6 text-blue-700" />}
          selected={selectedMethod === 'paypal'}
          onSelect={() => onSelect('paypal')}
        />
        
        <PaymentOption
          id="applepay"
          name="Apple Pay"
          icon={<SiApple className="h-6 w-6" />}
          selected={selectedMethod === 'applepay'}
          onSelect={() => onSelect('applepay')}
        />
        
        <PaymentOption
          id="googlepay"
          name="Google Pay"
          icon={<SiGooglepay className="h-6 w-6" />}
          selected={selectedMethod === 'googlepay'}
          onSelect={() => onSelect('googlepay')}
        />
      </div>
    </div>
  );
};

const PaymentOption = ({ id, name, icon, selected, onSelect }) => {
  return (
    <div
      className={\`border rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-all \${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 hover:border-gray-300'
      }\`}
      onClick={onSelect}
    >
      {icon}
      <span className="mt-2 text-sm">{name}</span>
    </div>
  );
};
          `,
          impactArea: "UI",
          difficulty: 4,
          estimatedConversionImprovement: "+7-14%"
        },
        {
          id: uuidv4(),
          title: "Implement Billing = Shipping Checkbox",
          description: "Add a prominent checkbox to copy shipping address to billing address, reducing the number of fields users need to complete during checkout.",
          implementation: `
// Add this to your checkout form
const AddressSection = () => {
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  
  // Update billing address when checkbox changes
  useEffect(() => {
    if (useShippingForBilling) {
      setBillingAddress(shippingAddress);
    }
  }, [useShippingForBilling, shippingAddress]);
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Shipping Address</h3>
        <AddressForm 
          address={shippingAddress}
          onChange={setShippingAddress}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="use-shipping" 
          checked={useShippingForBilling}
          onCheckedChange={setUseShippingForBilling}
        />
        <Label htmlFor="use-shipping" className="text-sm font-medium">
          Billing address same as shipping address
        </Label>
      </div>
      
      {!useShippingForBilling && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Billing Address</h3>
          <AddressForm 
            address={billingAddress}
            onChange={setBillingAddress}
          />
        </div>
      )}
    </div>
  );
};
          `,
          impactArea: "UX",
          difficulty: 2,
          estimatedConversionImprovement: "+4-7%"
        },
        {
          id: uuidv4(),
          title: "Add Trust Signals and Security Indicators",
          description: "Add visible security badges, trust signals, and SSL indicators throughout the checkout process, especially near payment fields where 41.2% of users drop off.",
          implementation: `
// Create a TrustSignals component
const TrustSignals = () => {
  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Secure SSL Encrypted Payment</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <img 
            src="/images/trust/ssl-badge.svg" 
            alt="SSL Secure" 
            className="h-10"
          />
          <img 
            src="/images/trust/stripe-badge.svg" 
            alt="Powered by Stripe" 
            className="h-10"
          />
          <img 
            src="/images/trust/norton-badge.svg" 
            alt="Norton Secured" 
            className="h-10"
          />
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Your payment information is securely processed by Stripe, a PCI-DSS Level 1 compliant payment processor.
          We never store your full credit card details on our servers.
        </p>
      </div>
    </div>
  );
};

// Add this component below your PaymentForm
          `,
          impactArea: "trust",
          difficulty: 1,
          estimatedConversionImprovement: "+3-6%"
        }
      ];
    } else {
      // Use AI-generated suggestions
      optimizationSuggestions = grokResponse;
    }
    
    // Return suggestions to the client
    res.status(200).json({
      success: true,
      message: 'Checkout flow analysis completed successfully',
      data: {
        analytics: checkoutAnalytics,
        suggestions: optimizationSuggestions
      }
    });
  } catch (error) {
    console.error('Error analyzing checkout flow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to analyze checkout flow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;