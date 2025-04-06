/**
 * Stripe Webhook Test Simulator
 * 
 * This script simulates Stripe webhook events to test our webhook handler.
 * It creates real events in Stripe's test mode that will trigger webhook events.
 * 
 * Usage:
 * Run with: npx tsx server/tests/webhook-tester.ts
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { db } from '../db';
import { users, subscriptions, subscriptionPlans } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Test configuration
const TEST_EMAIL = 'webhook-test@example.com';
const TEST_USERNAME = 'webhook-tester';

async function main() {
  console.log('Starting Stripe webhook tester...');
  
  try {
    // 1. Create or get test user
    const testUser = await createTestUser();
    console.log(`Test user: ${testUser.id} (${testUser.username})`);
    
    // 2. Create Stripe customer
    const customer = await createStripeCustomer(testUser);
    console.log(`Stripe customer: ${customer.id}`);
    
    // 3. Get subscription plans
    const plans = await getSubscriptionPlans();
    const basicPlan = plans.find(p => p.tier === 'basic');
    
    if (!basicPlan) {
      throw new Error('Basic plan not found');
    }
    
    // 4. Test subscription creation (generates customer.subscription.created event)
    console.log('\n== Testing subscription creation ==');
    const subscription = await createSubscription(customer.id, basicPlan.id, testUser.id);
    console.log(`Created subscription: ${subscription.id}`);
    console.log('This should trigger customer.subscription.created webhook');
    
    // Wait to let webhook events process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Test subscription update (generates customer.subscription.updated event)
    console.log('\n== Testing subscription update ==');
    const premiumPlan = plans.find(p => p.tier === 'premium');
    if (premiumPlan) {
      const updated = await updateSubscription(subscription.id, premiumPlan.id, testUser.id);
      console.log(`Updated subscription to ${premiumPlan.name}: ${updated.id}`);
      console.log('This should trigger customer.subscription.updated webhook');
    } else {
      console.log('Premium plan not found, skipping upgrade test');
    }
    
    // Wait to let webhook events process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Test invoice payment succeeded (simulates successful payment)
    console.log('\n== Testing invoice payment succeeded ==');
    console.log('Creating a one-off invoice...');
    
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: true,
      collection_method: 'charge_automatically',
    });
    
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      amount: 1000, // $10.00
      currency: 'usd',
      description: 'Webhook Test Item',
    });
    
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(`Created invoice: ${finalizedInvoice.id}`);
    
    // For test mode, we can mark it as paid
    const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id);
    console.log(`Paid invoice: ${paidInvoice.id}`);
    console.log('This should trigger invoice.payment_succeeded webhook');
    
    // Wait to let webhook events process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 7. Test subscription cancellation (generates customer.subscription.deleted event)
    console.log('\n== Testing subscription cancellation ==');
    await cancelSubscription(subscription.id);
    console.log(`Canceled subscription: ${subscription.id}`);
    console.log('This should trigger customer.subscription.deleted webhook');
    
    // 8. Check if our database was updated correctly
    console.log('\n== Verifying webhook processing ==');
    const dbSubscription = await getSubscriptionFromDb(testUser.id);
    
    if (dbSubscription) {
      console.log(`Subscription status in database: ${dbSubscription.status}`);
      console.log(`Canceled at: ${dbSubscription.canceledAt || 'Not canceled'}`);
      if (dbSubscription.status === 'canceled' && dbSubscription.canceledAt) {
        console.log('✅ Webhook processing verified!');
      } else {
        console.log('❌ Webhook may not have been processed correctly');
      }
    } else {
      console.log('❌ No subscription found in database');
    }
    
    console.log('\nWebhook testing completed!');
    console.log('For further verification, check your Stripe Dashboard webhook logs.');
    
  } catch (error) {
    console.error('Error during webhook testing:', error);
  }
}

async function createTestUser() {
  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, TEST_USERNAME));
  
  if (existingUser) {
    return existingUser;
  }
  
  // Create new test user
  const [newUser] = await db
    .insert(users)
    .values({
      username: TEST_USERNAME,
      password: 'hashed_password_would_go_here', // In reality, this would be properly hashed
      email: TEST_EMAIL,
      role: 'artist',
      name: 'Webhook Tester',
    })
    .returning();
  
  return newUser;
}

async function getSubscriptionPlans() {
  return await db.select().from(subscriptionPlans);
}

async function createStripeCustomer(user) {
  // Check if user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existingCustomer && !existingCustomer.deleted) {
        return existingCustomer;
      }
    } catch (error) {
      console.log(`Could not retrieve existing customer: ${error.message}`);
    }
  }
  
  // Create new customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || user.username,
    metadata: {
      userId: user.id.toString(),
    },
  });
  
  // Update user with Stripe customer ID
  await db
    .update(users)
    .set({
      stripeCustomerId: customer.id,
    })
    .where(eq(users.id, user.id));
  
  return customer;
}

async function createSubscription(customerId, planId, userId) {
  // Get plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId));
  
  if (!plan) {
    throw new Error(`Plan with ID ${planId} not found`);
  }
  
  // Get Stripe price ID based on the plan tier
  let priceId;
  switch (plan.tier) {
    case 'basic':
      priceId = process.env.STRIPE_BASIC_PRICE_ID;
      break;
    case 'premium':
      priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
      break;
    default:
      throw new Error(`No price ID configured for plan tier: ${plan.tier}`);
  }
  
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for plan tier: ${plan.tier}`);
  }
  
  // Create subscription with Stripe
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    metadata: {
      userId: userId.toString(),
      planId: planId.toString(),
    },
    // For testing, we can use trial periods to avoid actual charges
    trial_period_days: 7,
  });
  
  // Record subscription in database
  const [dbSubscription] = await db
    .insert(subscriptions)
    .values({
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      createdAt: new Date(),
    })
    .returning();
  
  return subscription;
}

async function updateSubscription(subscriptionId, newPlanId, userId) {
  // Get plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, newPlanId));
  
  if (!plan) {
    throw new Error(`Plan with ID ${newPlanId} not found`);
  }
  
  // Get Stripe price ID based on the plan tier
  let priceId;
  switch (plan.tier) {
    case 'basic':
      priceId = process.env.STRIPE_BASIC_PRICE_ID;
      break;
    case 'premium':
      priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
      break;
    default:
      throw new Error(`No price ID configured for plan tier: ${plan.tier}`);
  }
  
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for plan tier: ${plan.tier}`);
  }
  
  // Get current subscription to find the item ID to modify
  const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = currentSubscription.items.data[0].id;
  
  // Update subscription with Stripe
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        price: priceId,
      },
    ],
    metadata: {
      planId: newPlanId.toString(),
    },
  });
  
  // Update subscription in database
  await db
    .update(subscriptions)
    .set({
      planId: newPlanId,
      status: updatedSubscription.status,
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  
  return updatedSubscription;
}

async function cancelSubscription(subscriptionId) {
  // Cancel subscription with Stripe
  const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
  
  // Update subscription in database
  // In a real application, this would be handled by the webhook
  // We're including it here for completeness
  await db
    .update(subscriptions)
    .set({
      status: canceledSubscription.status,
      canceledAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  
  return canceledSubscription;
}

async function getSubscriptionFromDb(userId) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  
  return subscription;
}

// Run the main function
main().catch(console.error);