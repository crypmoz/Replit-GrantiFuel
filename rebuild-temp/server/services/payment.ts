import Stripe from 'stripe';
import { logger } from '../middleware/logger';
import env from '../config/env';

export class PaymentService {
  private stripe: Stripe;
  
  constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not set. Payment functionality will be limited.');
      this.stripe = new Stripe('', { apiVersion: '2023-10-16' });
      return;
    }
    
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  
  isConfigured(): boolean {
    return !!env.STRIPE_SECRET_KEY;
  }
  
  async createCustomer(email: string, name: string, metadata: any = {}): Promise<Stripe.Customer> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      return await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }
  
  async createPaymentIntent(amount: number, currency: string = 'usd', customerId?: string): Promise<Stripe.PaymentIntent> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
      };
      
      if (customerId) {
        paymentIntentOptions.customer = customerId;
      }
      
      return await this.stripe.paymentIntents.create(paymentIntentOptions);
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  async createSubscription(
    customerId: string, 
    priceId: string,
    metadata: any = {}
  ): Promise<Stripe.Subscription> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      return await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata,
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }
  
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
      throw error;
    }
  }
  
  async handleWebhook(body: any, signature: string): Promise<Stripe.Event> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payment service is not configured. Please set STRIPE_SECRET_KEY.');
      }
      
      // This should be replaced with your actual webhook secret from Stripe
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }
      
      return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();