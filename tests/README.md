# GrantiFuel Testing Tools

This directory contains tools and resources for testing the GrantiFuel application before deployment to production.

## Overview of Testing Resources

### Test Plans and Checklists

1. **App Test Plan** (`app-test-plan.md`)
   - Comprehensive list of test cases organized by feature
   - Use as a reference for manual feature testing

2. **E2E Test Flows** (`e2e-test-flows.md`)
   - Step-by-step user flows for manual testing
   - Covers critical user journeys through the application

3. **Pre-Launch Checklist** (`pre-launch-checklist.md`)
   - Detailed checklist for final verification before going live
   - Covers environment, security, performance, and more

### Testing Scripts

1. **API Health Checker** (`api-health-checker.js`)
   - Tests the health of critical API endpoints
   - Verifies that endpoints return expected responses
   
   Usage:
   ```
   node tests/api-health-checker.js
   ```

2. **Code Quality Checker** (`code-quality-checker.js`)
   - Scans codebase for common issues and potential bugs
   - Helps identify console logs, hardcoded credentials, etc.
   
   Usage:
   ```
   node tests/code-quality-checker.js
   ```

3. **Database Health Checker** (`db-health-checker.js`)
   - Tests database connection and schema
   - Verifies tables, relationships, and basic performance
   
   Usage:
   ```
   node tests/db-health-checker.js
   ```

## Testing Process

For the most thorough testing process before deployment, follow these steps:

1. **Automated Checks**
   - Run the database health checker to verify data structure
   - Run the API health checker to verify endpoints
   - Run the code quality checker to identify potential issues

2. **Manual Testing**
   - Follow the E2E test flows for major user journeys
   - Verify all items in the app test plan
   - Complete the pre-launch checklist

3. **User Acceptance Testing**
   - Have real users test the application
   - Document and address any issues found

## Tips for Effective Testing

- Test with different user roles (admin, grant writer, manager, artist)
- Test on multiple browsers and devices
- Test with realistic data volumes
- Document any bugs or issues found during testing
- Verify fixes for previously identified issues

## Adding New Tests

As the application evolves, you may need to add new tests:

1. Update the test plans with new features or user flows
2. Add new assertions to the automated test scripts
3. Update the pre-launch checklist with new requirements