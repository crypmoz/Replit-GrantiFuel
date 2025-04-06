/**
 * Subscription Tester
 * 
 * This script tests the subscription workflow by simulating different scenarios:
 * - Creating a new subscription
 * - Upgrading a subscription
 * - Downgrading a subscription
 * - Canceling a subscription
 * 
 * Usage:
 * Run with: npx tsx server/tests/subscription-tester.ts
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
const TEST_EMAIL = 'test-subscription@example.com';
const TEST_USERNAME = 'subscription-tester';

async function main() {
  console.log('Starting subscription tester...');
  
  try {
    // 1. Clean up previous test data
    await cleanupPreviousTests();
    
    // 2. Create test user if doesn't exist
    const testUser = await createTestUser();
    console.log(`Test user created with ID: ${testUser.id}`);
    
    // 3. Get available subscription plans
    const plans = await getSubscriptionPlans();
    console.log(`Found ${plans.length} subscription plans`);
    
    if (plans.length < 2) {
      throw new Error('Need at least 2 subscription plans for testing upgrades/downgrades');
    }
    
    // 4. Create a Stripe customer
    const customer = await createStripeCustomer(testUser);
    console.log(`Created Stripe customer: ${customer.id}`);
    
    // 5. Create initial subscription (using first paid plan)
    const paidPlan = plans.find(p => p.tier !== 'free') || plans[1];
    const initialSubscription = await createSubscription(customer.id, paidPlan.id, testUser.id);
    console.log(`Created initial subscription: ${initialSubscription.id} (Plan: ${paidPlan.name})`);
    
    // 6. Verify subscription was created in database
    const dbSubscription = await verifySubscriptionInDatabase(testUser.id);
    console.log(`Verified subscription in database: ${dbSubscription?.id || 'Not found'}`);
    
    // 7. Simulate upgrade/downgrade
    const differentPlan = plans.find(p => p.id !== paidPlan.id && p.tier !== 'free') || plans[0];
    console.log(`Simulating change to plan: ${differentPlan.name} (${differentPlan.tier})`);
    
    const updatedSubscription = await updateSubscription(
      initialSubscription.id, 
      differentPlan.id,
      testUser.id
    );
    console.log(`Updated subscription: ${updatedSubscription.id} (Plan: ${differentPlan.name})`);
    
    // 8. Verify webhook handling
    console.log('\nTo fully test webhook handling:');
    console.log('1. Go to the Stripe dashboard and find this customer');
    console.log('2. Trigger the relevant events manually (payment_succeeded, etc.)');
    console.log('3. Verify your webhook handler processes them correctly');
    
    // 9. Clean up (optionally cancel subscription)
    const keepTestData = process.env.KEEP_TEST_DATA === 'true';
    if (!keepTestData) {
      console.log('\nCleaning up test data...');
      await cancelSubscription(initialSubscription.id);
      // Note: We're not deleting the test user here to maintain history
      console.log('Test data cleaned up');
    } else {
      console.log('\nKeeping test data for manual inspection');
    }
    
    console.log('\nSubscription testing completed successfully!');
    
  } catch (error) {
    console.error('Error during subscription testing:', error);
    process.exit(1);
  }
}

async function cleanupPreviousTests() {
  // Find test user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, TEST_USERNAME));
  
  if (existingUser) {
    // Find any existing subscriptions
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, existingUser.id));
    
    if (existingSubscription?.stripeSubscriptionId) {
      try {
        // Cancel the subscription in Stripe
        await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
        console.log(`Canceled existing subscription: ${existingSubscription.stripeSubscriptionId}`);
      } catch (error) {
        console.log(`Could not cancel subscription: ${error.message}`);
      }
      
      // Delete the subscription from the database
      await db
        .delete(subscriptions)
        .where(eq(subscriptions.id, existingSubscription.id));
    }
    
    // Optionally delete test user
    // We're not deleting users to maintain history
    // await db.delete(users).where(eq(users.id, existingUser.id));
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
      name: 'Subscription Tester',
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

async function verifySubscriptionInDatabase(userId) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  
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
    .where(eq(subscriptions.userId, userId));
  
  return updatedSubscription;
}

async function cancelSubscription(subscriptionId) {
  // Cancel subscription with Stripe
  const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
  
  // Update subscription in database
  // We don't delete it to maintain history
  await db
    .update(subscriptions)
    .set({
      status: canceledSubscription.status,
      canceledAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  
  return canceledSubscription;
}

// Run the main function
main().catch(console.error);