# GrantiFuel Subscription Testing

This directory contains tools and documentation for testing the subscription functionality in GrantiFuel.

## Overview

The subscription system integrates with Stripe to enable:
- Free, Basic, and Premium subscription tiers
- Subscription creation, upgrading, downgrading, and cancellation
- Webhook handling for subscription lifecycle events
- Subscription management in the user interface

## Available Tests

### 1. Subscription Lifecycle Tester (`subscription-tester.ts`)

Tests the core subscription lifecycle through the API:
- Creating a new subscription
- Upgrading a subscription
- Downgrading a subscription
- Canceling a subscription

Run with:
```bash
npx tsx server/tests/subscription-tester.ts
```

### 2. User Subscription Flow Tester (`user-subscription-flow.ts`)

Simulates a user going through the subscription flow:
- User logs in
- User views subscription plans
- User selects a plan and creates a subscription
- User upgrades/downgrades their subscription
- User cancels their subscription

Run with:
```bash
npx tsx server/tests/user-subscription-flow.ts
```

### 3. Webhook Tester (`webhook-tester.ts`)

Tests the webhook handler for subscription events:
- Creates real events in Stripe's test mode
- Triggers webhook events to test our webhook handler
- Verifies that the database is updated correctly

Run with:
```bash
npx tsx server/tests/webhook-tester.ts
```

## Manual Testing Guide

For thorough end-to-end testing with UI interactions, refer to the [Manual Testing Guide](manual-test-guide.md).

## Convenient Test Runner

Use the test runner script to easily run any or all tests:

```bash
./test-subscriptions.sh all    # Run all tests
./test-subscriptions.sh sub    # Run subscription lifecycle test
./test-subscriptions.sh flow   # Run user flow test
./test-subscriptions.sh webhook # Run webhook test
```

## Prerequisites for Testing

1. Ensure the application is running
2. Make sure Stripe API keys are set in the environment:
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`
   - `STRIPE_WEBHOOK_SECRET` (for webhook tests)
3. Use Stripe test mode cards for payments:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Insufficient funds: `4000 0000 0000 9995`
