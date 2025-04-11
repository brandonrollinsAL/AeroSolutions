import Stripe from 'stripe';
import { 
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type MarketplaceItem, type InsertMarketplaceItem
} from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  // Subscription plans
  async createPlan(plan: InsertSubscriptionPlan): Promise<{ stripePriceId: string }> {
    try {
      // Create a product in Stripe
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          features: JSON.stringify(plan.features),
        },
      });

      // Create a price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(Number(plan.price) * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: plan.interval as 'month' | 'year',
        },
        metadata: {
          plan_id: plan.name,
        },
      });

      return {
        stripePriceId: price.id,
      };
    } catch (error) {
      console.error('Error creating Stripe plan:', error);
      throw new Error(`Failed to create Stripe plan: ${error.message}`);
    }
  }

  // Customer operations
  async createCustomer(name: string, email: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        name,
        email,
      });
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  // Subscription operations
  async createSubscription(customerId: string, priceId: string): Promise<{
    subscriptionId: string;
    clientSecret: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      };
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw new Error(`Failed to create Stripe subscription: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ canceled: boolean }> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return {
        canceled: subscription.status === 'canceled',
      };
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw new Error(`Failed to cancel Stripe subscription: ${error.message}`);
    }
  }

  // Marketplace items
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<{
    stripeProductId: string;
    stripePriceId: string;
  }> {
    try {
      // Create a product in Stripe
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: {
          category: item.category,
          tags: JSON.stringify(item.tags),
          seller_id: item.sellerId.toString(),
        },
        images: item.images as string[],
      });

      // Create a price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
        currency: 'usd',
      });

      return {
        stripeProductId: product.id,
        stripePriceId: price.id,
      };
    } catch (error) {
      console.error('Error creating Stripe marketplace item:', error);
      throw new Error(`Failed to create Stripe marketplace item: ${error.message}`);
    }
  }

  async createPaymentIntent(
    customerId: string,
    priceId: string,
    quantity: number = 1
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        setup_future_usage: 'off_session',
        amount: 0, // Will be calculated based on price and quantity
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          price_id: priceId,
          quantity: quantity.toString(),
        },
      });

      // Get the price from Stripe
      const price = await stripe.prices.retrieve(priceId);

      // Update the payment intent with the correct amount
      const updatedPaymentIntent = await stripe.paymentIntents.update(
        paymentIntent.id,
        {
          amount: (price.unit_amount * quantity),
        }
      );

      return {
        clientSecret: updatedPaymentIntent.client_secret,
        paymentIntentId: updatedPaymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      throw new Error(`Failed to create Stripe payment intent: ${error.message}`);
    }
  }

  // Webhooks
  constructEvent(payload: string, signature: string, webhookSecret: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Error constructing Stripe event:', error);
      throw new Error(`Failed to construct Stripe event: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();