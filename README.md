# GrantiFuel - AI-Powered Grant Assistant

![GrantiFuel Logo](generated-icon.png)

## Overview

GrantiFuel is a specialized AI-powered platform designed to simplify grant application processes for musicians and artists. By leveraging intelligent technology and intuitive discovery tools, GrantiFuel helps creative professionals find, prepare, and track grant opportunities tailored to their unique profiles.

## Features

### For Artists & Musicians

- **AI-Driven Grant Recommendations**: Receive personalized grant suggestions based on your artistic profile, genre, career stage, and project type.
- **Application Preparation**: Generate initial drafts for grant applications using AI technology that understands your artistic background.
- **Progress Tracking**: Monitor application status and upcoming deadlines in a comprehensive dashboard.
- **Document Management**: Store and organize important portfolio materials for quick access during applications.

### For Grant Writers & Organizations

- **Grant Creation**: Organizations can easily create and publish grant opportunities on the platform.
- **Applicant Management**: Review and manage incoming applications through an intuitive interface.
- **Analytics**: Gain insights into application trends and demographic data.

## Tech Stack

GrantiFuel is built with modern, scalable technologies:

- **Frontend**: React.js with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Secure session-based authentication with role-based access control
- **AI Integration**: Advanced AI capabilities powered by DeepSeek API
- **Payment Processing**: Stripe integration for subscription management

## Subscription Plans

GrantiFuel offers various subscription tiers to match different needs:

- **Free**: Basic grant discovery and limited application tools
- **Pro** ($19/month or $15/month annually): Full access to AI recommendations, application tools, and document storage
- **Teams** ($39/month or $33/month annually): Collaboration features for organizations and management tools

## Development Features

- **Comprehensive Testing**: Automated testing infrastructure for code quality and database health
- **Secure Authentication**: Role-based access control with server middleware and frontend protections
- **Subscription Management**: Complete integration with Stripe for payment processing
- **Background Processing**: Efficient document analysis with throttling and task management
- **Circuit Breaker Patterns**: Enhanced API resilience for external services
- **Comprehensive Testing**: Automated testing infrastructure for code quality and database health
- **Secure Authentication**: Role-based access control with server middleware and frontend protections
- **Subscription Management**: Complete integration with Stripe for payment processing
- **Background Processing**: Efficient document analysis with throttling and task management
- **Circuit Breaker Patterns**: Enhanced API resilience for external services
- **Intelligent Caching**: Performance optimization for grant recommendations and AI services

### Testing Tools

GrantiFuel includes powerful testing tools for subscription management:

- **Subscription Lifecycle Tests**: Automated tests for the subscription creation, upgrade, downgrade, and cancellation flow
- **User Subscription Flow Tests**: Integration tests simulating real user subscription journey
- **Webhook Handler Tests**: Tests for Stripe webhook event handling
- **Manual Testing Guide**: Comprehensive guide for manually testing the subscription functionality

Run subscription tests with:
```bash
./test-subscriptions.sh all    # Run all tests
```
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

For more details, see the testing documentation in server/tests/README.md.
- **User Subscription Flow Tests**: Integration tests simulating real user subscription journey
- **Webhook Handler Tests**: Tests for Stripe webhook event handling
- **Manual Testing Guide**: Comprehensive guide for manually testing the subscription functionality

Run subscription tests with:
```bash
./test-subscriptions.sh all    # Run all tests
```

For more details, see the [testing documentation](server/tests/README.md).

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database
- Stripe account (for payment processing)
- DeepSeek API key (for AI features)

### Environment Setup

The application requires the following environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-session-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up the database with `npm run db:push`
4. Start the application with `npm run dev`

## Contributing

Contributions to GrantiFuel are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Special thanks to all the musicians and organizations who provided feedback during development
- Built with support from the creative community