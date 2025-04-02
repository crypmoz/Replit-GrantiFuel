# GrantiFuel E2E Test Flows

This document outlines key user flows to test manually before deployment.

## Test User Credentials

**Admin:**
- Username: admin_tester
- Password: adminPass123

**Grant Writer:**
- Username: grant_writer_tester
- Password: grantPass123

**Manager:**
- Username: manager_tester
- Password: managerPass123

**Artist:**
- Username: artist_tester
- Password: artistPass123

## Flow 1: New User Registration & Onboarding

1. **Access the application**
   - Navigate to the landing page
   - Click "Get Started" button
   - Verify: Redirect to /auth page

2. **Create a new account**
   - Fill out registration form with valid data
     - Username: test_user_{timestamp}
     - Email: test_{timestamp}@example.com
     - Password: TestPassword123
     - Confirm Password: TestPassword123
     - Select Role: Artist
   - Click "Register" button
   - Verify: Successful registration and redirect to dashboard

3. **Complete onboarding**
   - Check onboarding progress display on dashboard
   - Complete profile information
     - Navigate to Profile page
     - Fill all required fields
     - Upload a profile picture
     - Save changes
   - Verify profile is saved correctly
   - Return to dashboard 
   - Verify: Onboarding progress is updated

4. **Explore grant recommendations**
   - Navigate to Grant Recommendations
   - Verify: Artist profile data is auto-loaded
   - Verify: Recommendations are displayed
   - Try refreshing recommendations
   - Verify: Loading states are shown correctly

## Flow 2: Grant Management (Grant Writer)

1. **Log in as Grant Writer**
   - Log in with grant writer credentials
   - Verify: Redirect to dashboard
   - Verify: Grant Writer options are available in sidebar

2. **Create a new grant**
   - Navigate to Grants page
   - Click "Create New Grant" button
   - Fill out grant form with test data
     - Name: Test Grant {timestamp}
     - Organization: Test Organization
     - Amount: $10,000
     - Deadline: (select future date)
     - Description: Test description for grant opportunity
   - Click "Save Grant" button
   - Verify: Grant is created and appears in grants list

3. **Edit the grant**
   - Find the created grant in the list
   - Click to view details
   - Click "Edit" button
   - Modify some fields
   - Save changes
   - Verify: Changes are reflected in grant details

4. **Create a template**
   - Navigate to Templates
   - Click "Create New Template"
   - Fill template information
   - Save the template
   - Verify: Template appears in templates list

## Flow 3: Artist Application Flow

1. **Log in as Artist**
   - Log in with artist credentials
   - Verify: Redirect to dashboard
   - Verify: Artist options are available in sidebar

2. **Create/Update Artist Profile**
   - Navigate to Profile page
   - Update artist information 
   - Save changes
   - Verify: Profile updates are reflected

3. **Find a grant and apply**
   - Navigate to Grants page
   - Browse available grants
   - Click on a grant to view details
   - Click "Apply" button
   - Fill out application form
   - Save as draft
   - Verify: Application is saved in draft status

4. **Complete and submit application**
   - Navigate to Applications
   - Find the draft application
   - Continue filling the application
   - Submit the application
   - Verify: Application status changes to "submitted"

5. **Use AI Assistant**
   - Navigate to AI Assistant
   - Try asking a question about grants
   - Verify: Response is generated
   - Try generating a proposal
   - Verify: Proposal is generated

## Flow 4: Manager Workflow

1. **Log in as Manager**
   - Log in with manager credentials
   - Verify: Redirect to dashboard
   - Verify: Manager options are available in sidebar

2. **Review applications**
   - Navigate to Applications page
   - Verify a list of all applications is shown
   - Filter applications by status
   - Open an application to review
   - Add a comment or update status
   - Verify: Changes are saved

3. **View artists and grants**
   - Navigate to Artists page
   - Verify: List of artists is visible
   - Navigate to Grants page
   - Verify: List of grants is visible
   - Verify: Cannot create new grants (should be disabled)

## Flow 5: Admin Management

1. **Log in as Admin**
   - Log in with admin credentials
   - Verify: Redirect to dashboard
   - Verify: Admin options are available in sidebar

2. **User Management**
   - Navigate to Admin > User Management
   - Verify: List of users is displayed
   - Try searching/filtering users
   - View user details
   - Edit a user's information
   - Verify: Changes are saved

3. **Access Control Testing**
   - Verify: Can access all sections of the application
   - Navigate through all major sections
   - Create, edit, and delete content in various sections
   - Verify: All admin operations work as expected

## Flow 6: Payment and Subscription Flow

1. **Access Pricing Page**
   - Navigate to Pricing page
   - Verify: Plans are displayed with correct pricing
   - Click "Subscribe" on a plan
   - Verify: Redirect to checkout page

2. **Complete Checkout**
   - Verify: Stripe Elements loads correctly
   - Enter test card information:
     - Card Number: 4242 4242 4242 4242
     - Expiry: Any future date
     - CVC: Any 3 digits
   - Complete payment
   - Verify: Successful payment confirmation
   - Verify: Subscription status is updated

3. **Access Premium Features**
   - Navigate to a premium feature
   - Verify: Feature is accessible
   - Test the premium feature functionality
   - Verify: Works as expected

## Notes on Testing

- Document any bugs or issues found during testing
- Note any UI inconsistencies or usability issues
- Pay attention to loading states and error messages
- Test on different browsers if possible
- Test responsive design by resizing browser window
- Verify all critical actions have proper error handling