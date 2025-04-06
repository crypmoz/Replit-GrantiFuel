#!/bin/bash

# Comprehensive test runner for subscription tests
echo "===================================="
echo "GrantiFuel Subscription Test Runner"
echo "===================================="
echo

# Check for required environment variables
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ ERROR: STRIPE_SECRET_KEY environment variable is not set"
    exit 1
fi

if [ -z "$VITE_STRIPE_PUBLIC_KEY" ]; then
    echo "❌ ERROR: VITE_STRIPE_PUBLIC_KEY environment variable is not set"
    exit 1
fi

echo "✅ Stripe API keys found"
echo "Running in test mode..."
echo

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run all subscription tests
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}Running ${test_name}...${NC}"
    npx tsx ${test_file}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
    fi
    echo
}

# Run all tests
run_all_tests() {
    run_test "Subscription Lifecycle Test" "server/tests/subscription-tester.ts"
    run_test "User Subscription Flow Test" "server/tests/user-subscription-flow.ts"
    
    if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
        run_test "Webhook Handler Test" "server/tests/webhook-tester.ts"
    else
        echo -e "${YELLOW}⚠️ Skipping webhook test - STRIPE_WEBHOOK_SECRET not set${NC}"
    fi
}

case "$1" in
    "subscription")
        run_test "Subscription Lifecycle Test" "server/tests/subscription-tester.ts"
        ;;
    "flow")
        run_test "User Subscription Flow Test" "server/tests/user-subscription-flow.ts"
        ;;
    "webhook")
        if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
            run_test "Webhook Handler Test" "server/tests/webhook-tester.ts"
        else
            echo -e "${RED}❌ Cannot run webhook test - STRIPE_WEBHOOK_SECRET not set${NC}"
            exit 1
        fi
        ;;
    *)
        run_all_tests
        ;;
esac

echo "===================================="
echo "Testing complete!"
echo "===================================="