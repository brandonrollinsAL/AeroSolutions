import Stripe from 'stripe';
import { type User } from '@shared/schema';
import { storage } from '../storage';

// Initialize Stripe with secret key
// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

// Get the Stripe publishable key
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY as string;
}

// Create a Stripe customer
export async function createStripeCustomer(user: User): Promise<string> {
  try {
    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      metadata: {
        userId: user.id.toString(),
      },
    });

    // Update user with Stripe customer ID
    await storage.updateUser(user.id, { stripeCustomerId: customer.id });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

// Create a payment intent for one-time payments
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    };

    // Add customer ID if available
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

// Create a subscription for a customer
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
}

// Get a subscription
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error('Failed to retrieve subscription');
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Create a product in Stripe
export async function createProduct(
  name: string,
  description: string,
  active: boolean = true,
  metadata?: Record<string, string>
): Promise<Stripe.Product> {
  try {
    const product = await stripe.products.create({
      name,
      description,
      active,
      metadata,
    });
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

// Create a price for a product
export async function createPrice(
  productId: string,
  amount: number,
  currency: string = 'usd',
  recurring?: { interval: 'day' | 'week' | 'month' | 'year'; interval_count?: number }
): Promise<Stripe.Price> {
  try {
    const priceParams: Stripe.PriceCreateParams = {
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
    };

    // Add recurring parameters if this is a subscription
    if (recurring) {
      priceParams.recurring = recurring;
    }

    const price = await stripe.prices.create(priceParams);
    return price;
  } catch (error) {
    console.error('Error creating price:', error);
    throw new Error('Failed to create price');
  }
}

// Webhook event handler
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw new Error('Failed to handle webhook event');
  }
}

// Handle payment intent succeeded event
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Example: Update order status based on metadata
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      // Update order status to paid/completed
      console.log(`Payment succeeded for order ${orderId}`);
      // Implement your logic here
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

// Handle invoice payment succeeded event
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    if (invoice.subscription) {
      // Example: Update subscription status
      console.log(`Invoice payment succeeded for subscription ${invoice.subscription}`);
      // Implement your logic here
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

// Handle subscription updated event
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const customerId = subscription.customer as string;
    // Find user by Stripe customer ID
    // Update user subscription details
    console.log(`Subscription ${subscription.id} updated for customer ${customerId}`);
    // Implement your logic here
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deleted event
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    const customerId = subscription.customer as string;
    // Find user by Stripe customer ID
    // Update user subscription status
    console.log(`Subscription ${subscription.id} deleted for customer ${customerId}`);
    // Implement your logic here
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}