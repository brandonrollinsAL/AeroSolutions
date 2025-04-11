import Stripe from 'stripe';
import type { InsertSubscriptionPlan, InsertMarketplaceItem } from '@shared/schema';

// Initialize Stripe with API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Using stable version compatible with our code
  // Note: the newest version is '2025-03-31.basil' but we're using a compatible stable version
});

class StripeService {
  /**
   * Create a new customer in Stripe
   * @param name Customer name
   * @param email Customer email
   * @returns Stripe customer ID
   */
  async createCustomer(name: string, email: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        name,
        email,
        metadata: {
          source: 'Aero Solutions',
        },
      });
      
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create Stripe customer: ${String(error)}`);
    }
  }
  
  /**
   * Create a subscription plan in Stripe
   * @param plan Subscription plan data
   * @returns Stripe price ID
   */
  async createPlan(plan: InsertSubscriptionPlan): Promise<{ stripePriceId: string }> {
    try {
      // First create the product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          features: JSON.stringify(plan.features),
        },
        active: plan.isActive ?? true,
      });
      
      // Then create the price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(parseFloat(plan.price.toString()) * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: plan.interval as 'month' | 'year',
        },
        metadata: {
          plan_name: plan.name,
        },
      });
      
      return { stripePriceId: price.id };
    } catch (error) {
      console.error('Error creating Stripe plan:', error);
      throw new Error(`Failed to create Stripe plan: ${String(error)}`);
    }
  }
  
  /**
   * Create a subscription in Stripe
   * @param customerId Stripe customer ID
   * @param priceId Stripe price ID
   * @returns Subscription data
   */
  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<{
    subscriptionId: string;
    clientSecret: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }> {
    try {
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Type assertions for TypeScript compatibility
      const latestInvoice = typeof subscription.latest_invoice === 'string' 
        ? { payment_intent: null } 
        : subscription.latest_invoice as any;
      
      const paymentIntent = latestInvoice.payment_intent as any;
      
      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || '',
        currentPeriodStart: subscription.current_period_start as unknown as number,
        currentPeriodEnd: subscription.current_period_end as unknown as number,
      };
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw new Error(`Failed to create Stripe subscription: ${String(error)}`);
    }
  }
  
  /**
   * Cancel a subscription in Stripe
   * @param subscriptionId Stripe subscription ID
   * @returns Cancelled subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw new Error(`Failed to cancel Stripe subscription: ${String(error)}`);
    }
  }
  
  /**
   * Create a marketplace item in Stripe
   * @param item Marketplace item data
   * @returns Stripe product and price IDs
   */
  async createMarketplaceItem(
    item: InsertMarketplaceItem
  ): Promise<{ stripeProductId: string; stripePriceId: string }> {
    try {
      // Create the product
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: {
          category: item.category,
          tags: item.tags ? JSON.stringify(item.tags) : '',
          seller_id: item.sellerId.toString(),
        },
        active: item.isAvailable ?? true,
        images: item.images as string[],
      });
      
      // Create the price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(parseFloat(item.price.toString()) * 100), // Convert to cents
        currency: 'usd',
      });
      
      return {
        stripeProductId: product.id,
        stripePriceId: price.id,
      };
    } catch (error) {
      console.error('Error creating Stripe marketplace item:', error);
      throw new Error(`Failed to create Stripe marketplace item: ${String(error)}`);
    }
  }
  
  /**
   * Create a payment intent for a marketplace purchase
   * @param customerId Stripe customer ID
   * @param priceId Stripe price ID
   * @param quantity Item quantity
   * @returns Payment intent data
   */
  async createPaymentIntent(
    customerId: string,
    priceId: string,
    quantity: number = 1
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      // Get price information
      const price = await stripe.prices.retrieve(priceId);
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: (price.unit_amount || 0) * quantity,
        currency: 'usd',
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          price_id: priceId,
          quantity: quantity.toString(),
        },
      });
      
      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      throw new Error(`Failed to create Stripe payment intent: ${String(error)}`);
    }
  }
  
  /**
   * Get Stripe publishable key
   * @returns Stripe publishable key
   */
  getPublishableKey(): string {
    return process.env.STRIPE_PUBLISHABLE_KEY || '';
  }
}

export const stripeService = new StripeService();