#!/bin/bash

# Simple script to run subscription tests

echo "================================"
echo "GrantiFuel Subscription Tests"
echo "================================"
echo

if [ "$1" == "all" ]; then
  echo "Running all subscription tests..."
  npx tsx server/tests/subscription-tester.ts
  npx tsx server/tests/user-subscription-flow.ts
  npx tsx server/tests/webhook-tester.ts
elif [ "$1" == "sub" ]; then
  echo "Running subscription lifecycle test..."
  npx tsx server/tests/subscription-tester.ts
elif [ "$1" == "flow" ]; then
  echo "Running user flow test..."
  npx tsx server/tests/user-subscription-flow.ts
elif [ "$1" == "webhook" ]; then
  echo "Running webhook test..."
  npx tsx server/tests/webhook-tester.ts
else
  echo "Usage: ./test-subscriptions.sh [all|sub|flow|webhook]"
  echo "  all     - Run all subscription tests"
  echo "  sub     - Run subscription lifecycle test"
  echo "  flow    - Run user flow test"
  echo "  webhook - Run webhook test"
fi