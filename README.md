# Stripe Subscription System

This is a production-ready backend system built using **NestJS**, **Stripe**, **TypeORM**, and **PostgreSQL**, designed to handle subscription billing, plan sync, refund tracking, and webhook processing.

---

## Features

- Stripe integration (subscriptions, plans, refunds)
- Webhook support with signature verification
- Auto-syncing plans/prices from Stripe
- Subscription lifecycle management
- Refund tracking & update mechanism
- Centralized logging with Winston
- Global validation & exception handling
- Raw body handling for Stripe webhooks

---

## Tech Stack

- **NestJS**
- **Stripe SDK**
- **PostgreSQL**
- **TypeORM**
- **Winston Logger**
- **Custom Pipes & Filters**
- **Environment-based Config Module**

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Deeksha1108/Stripe_Subscriptions.git
cd stripe-subscription-system
2. Install dependencies
bash
Copy code
npm install
3. Set up environment variables
Create a .env file in the root with the following values:

env
Copy code
PORT=3000
NODE_ENV=development

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_NAME=stripe_db

LOG_LEVEL=debug
Make sure your Stripe keys are correct and test/live values are used appropriately.

Running the App
bash
Copy code
npm run start:dev
The app will start on http://localhost:3000

Folder Structure
arduino
Copy code
src/
│
├── common/             → Global pipes, filters
├── config/             → Environment, database & Stripe config
├── logger/             → Winston logger config
├── plans/              → Sync plans from Stripe
├── refunds/            → Refund tracking
├── stripe/             → Stripe client setup
├── subscriptions/      → Subscription CRUD & logic
└── webhooks/           → Stripe webhook handling

API Endpoints

POST /subscriptions
Create a new subscription in the DB (usually called internally from webhook).

GET /subscriptions/user/:userId
Fetch subscription of a user.

PATCH /subscriptions/update/:stripeSubId
Update a subscription using Stripe ID.

PATCH /subscriptions/cancel/:stripeSubId
Cancel an active subscription.

Webhook Handling
Handled in WebhookService. Raw body is extracted manually to validate Stripe signatures. Supports:

checkout.session.completed

customer.subscription.updated

customer.subscription.deleted

refund.updated

price.created/updated

product.created/updated

Logging
All logs are managed using Winston:

combined.log for all logs

error.log for errors

exceptions.log for uncaught exceptions

rejections.log for unhandled promises

You can find logs under /logs folder.

Validation & Error Handling
Global ValidationPipe handles DTO validation

Global HttpExceptionFilter returns structured, user-safe error messages

Logs detailed errors internally without exposing them to the client in production

Environment-Specific Behavior
Feature	Dev	Prod
Schema Sync
Verbose Logging	unless error
Stack Traces Hidden
Unsafe Exceptions	Sanitized

- Tips
- Use ngrok or Stripe CLI to test webhooks locally.

- Never expose your STRIPE_SECRET_KEY publicly.

- Use synchronize: false in production to avoid accidental data loss.


Author
Made by Deeksha
```
