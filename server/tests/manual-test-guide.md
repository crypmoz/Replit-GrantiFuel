# Manual Subscription Testing Guide

This guide is for manually testing the subscription flow in the GrantiFuel application.

## Prerequisites

1. A test account in the application
2. Access to the Stripe Dashboard
3. A Stripe test card (e.g., 4242 4242 4242 4242)

## Test Scenario 1: New Subscription

### Steps:

1. **Login to GrantiFuel**
   - Navigate to `/auth`
   - Log in with your test account
   - ✅ Verify you are redirected to the dashboard

2. **Navigate to Pricing Page**
   - Click on "Pricing & Plans" in the sidebar or dropdown menu
   - ✅ Verify the pricing page shows all plans (Free, Basic, Premium)

3. **Select a Paid Plan**
   - Click "Upgrade" or "Select" on the Basic plan
   - ✅ Verify you are redirected to the checkout page with plan details

4. **Complete the Payment**
   - Enter the test card details (4242 4242 4242 4242, any future date, any 3 digits for CVC)
   - Enter any name and valid email format
   - Click "Subscribe"
   - ✅ Verify the payment is processed and you see a success message
   - ✅ Verify you are redirected to the dashboard or a confirmation page

5. **Verify Subscription Status**
   - Navigate to Profile or Settings page
   - ✅ Verify your subscription shows as "Active" with the correct plan name
   - ✅ Verify the next billing date is displayed correctly
   - ✅ Verify you now have access to features included in the plan

## Test Scenario 2: Subscription Upgrade

### Steps:

1. **Start with an Active Basic Subscription**
   - Complete Test Scenario 1 if not already done
   - ✅ Verify you have an active Basic subscription

2. **Navigate to Pricing Page**
   - Click on "Pricing & Plans" in the sidebar or dropdown menu
   - ✅ Verify the pricing page shows your current plan as active

3. **Select to Upgrade**
   - Click "Upgrade" on the Premium plan
   - ✅ Verify you are redirected to the checkout page with upgrade details
   - ✅ Verify the page indicates this is an upgrade

4. **Complete the Upgrade**
   - The payment form should be pre-filled since you already have a payment method
   - Click "Confirm Upgrade"
   - ✅ Verify the upgrade is processed and you see a success message
   - ✅ Verify you are redirected to the dashboard or a confirmation page

5. **Verify New Subscription Status**
   - Navigate to Profile or Settings page
   - ✅ Verify your subscription now shows as "Active" with the Premium plan
   - ✅ Verify the next billing date is updated correctly
   - ✅ Verify you now have access to Premium features

## Test Scenario 3: Subscription Downgrade

### Steps:

1. **Start with an Active Premium Subscription**
   - Complete Test Scenario 2 if not already done
   - ✅ Verify you have an active Premium subscription

2. **Navigate to Pricing Page**
   - Click on "Pricing & Plans" in the sidebar or dropdown menu
   - ✅ Verify the pricing page shows your current plan as active

3. **Select to Downgrade**
   - Click "Downgrade" on the Basic plan
   - ✅ Verify you are redirected to a confirmation page
   - ✅ Verify the page explains when the downgrade will take effect (usually at the end of the current billing period)

4. **Confirm the Downgrade**
   - Click "Confirm Downgrade"
   - ✅ Verify you see a confirmation message
   - ✅ Verify you are redirected to the dashboard or profile page

5. **Verify Downgrade Status**
   - Navigate to Profile or Settings page
   - ✅ Verify your subscription still shows as "Active" with the Premium plan
   - ✅ Verify there is an indication that you will be downgraded to Basic at the end of the current period
   - ✅ Verify you still have access to Premium features until the end of the current period

## Test Scenario 4: Subscription Cancellation

### Steps:

1. **Start with an Active Subscription**
   - Use an account with any active paid subscription
   - ✅ Verify the subscription is active

2. **Navigate to Profile or Settings**
   - Go to the page where subscription management is available
   - ✅ Verify you can see your current subscription details

3. **Cancel Subscription**
   - Click "Cancel Subscription" or similar
   - ✅ Verify you are shown a confirmation dialog explaining the consequences
   - ✅ Verify the dialog explains when the cancellation will take effect

4. **Confirm Cancellation**
   - Click "Confirm Cancellation"
   - ✅ Verify you see a confirmation message
   - ✅ Verify you are redirected to the dashboard or profile page

5. **Verify Cancellation Status**
   - Navigate to Profile or Settings page
   - ✅ Verify your subscription shows as "Canceled" or "Ending on [date]"
   - ✅ Verify there is an indication that you will lose access to paid features at the end of the current period
   - ✅ Verify you still have access to premium features until the end of the period

## Test Scenario 5: Reactivating a Canceled Subscription

### Steps:

1. **Start with a Canceled Subscription**
   - Complete Test Scenario 4 if not already done
   - ✅ Verify your subscription is canceled but still active until the end of the period

2. **Navigate to Profile or Settings**
   - Go to the page where subscription management is available
   - ✅ Verify you can see your canceled subscription details

3. **Reactivate Subscription**
   - Click "Reactivate Subscription" or similar
   - ✅ Verify you are shown a confirmation dialog

4. **Confirm Reactivation**
   - Click "Confirm Reactivation"
   - ✅ Verify you see a confirmation message
   - ✅ Verify you are redirected to the dashboard or profile page

5. **Verify Reactivation Status**
   - Navigate to Profile or Settings page
   - ✅ Verify your subscription shows as "Active" again
   - ✅ Verify the next billing date is displayed correctly
   - ✅ Verify the cancellation indicator is gone

## Test Scenario 6: Failed Payment Handling

### Steps:

1. **Start with an Active Subscription**
   - Use an account with any active paid subscription
   - ✅ Verify the subscription is active

2. **Simulate Failed Payment**
   - In the Stripe Dashboard, find the customer
   - Use Stripe's testing tools to simulate a failed payment
   - ✅ Verify the application shows a past due status for the subscription

3. **Verify Grace Period**
   - ✅ Verify you still have access to premium features during the grace period
   - ✅ Verify you receive notifications about the failed payment

4. **Update Payment Method**
   - Navigate to payment settings
   - Add a new payment method (different test card)
   - ✅ Verify the payment is retried and succeeds
   - ✅ Verify your subscription returns to "Active" status

## Notes for Testers

- Use Stripe's test card numbers for different scenarios:
  - `4242 4242 4242 4242` - Successful payment
  - `4000 0000 0000 0002` - Card declined
  - `4000 0000 0000 9995` - Insufficient funds

- After each test, verify in the Stripe Dashboard that:
  - The customer record was created/updated correctly
  - The subscription status matches what's shown in the app
  - The correct plan/price was applied

- For any issues found, record:
  - The scenario being tested
  - The steps taken
  - The expected result
  - The actual result
  - Any error messages or unusual behavior
