# End-to-End Subscription Management System (Using Stripe)

This project replicates a real-world, scalable **SaaS-style subscription billing system** and is a production-ready backend system built using **NestJS**, **Stripe**, **TypeORM**, and **PostgreSQL**, designed to handle subscription billing, plan sync, refund tracking, and webhook processing.
It handles everything end-to-end - from **checkout**, **subscription creation**, **updates**, **cancellations**, to **Stripe webhook processing** - just like how **Notion, Zoom, or Figma** manage user subscriptions behind the scenes.

---

## Key Features

- Full integration with **Stripe Checkout**, **Webhooks**, and **Refunds**
- Persistent subscription data stored in PostgreSQL
- Real-time syncing of plans/products/prices from Stripe
- Webhook event processing for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `refund.updated`
  - `price.created/updated`, `product.created/updated`
- Used **TypeORM** for DB layer
- Used **Winston Logger** for centralized error/info logging
- Custom **global ValidationPipe** and **HttpExceptionFilter**
- Config-driven and production-safe (`.env` with schema validation)

---

## Real-World Use Case

Let’s say you are building a SaaS app like Figma:

1. User clicks "Subscribe" → redirected to Stripe Checkout.
2. On success:
   - A webhook triggers: `checkout.session.completed`
   - Subscription is created and saved to DB
3. If user upgrades/cancels or changes plan → `subscription.updated` webhook fires
4. If user manually cancels → `subscription.deleted` webhook
5. If admin issues refund → `refund.updated` webhook fires
6. If you update plans/prices on Stripe → `price.created/updated` syncs DB

All this happens automatically in this system.

---

## Tech Stack

- **NestJS** (framework)
- **PostgreSQL** + **TypeORM** (database)
- **Stripe SDK** (`stripe` package)
- **Winston Logger** (central logging)
- **.env** based configuration with schema validation
- **Custom global error filter** and **validation pipe**

---

## Folder Structure

```
src/
├── stripe/               # Stripe service for checkout creation
├── subscriptions/        # Core subscription logic (CRUD + sync)
├── webhooks/             # Stripe webhook event handling
├── refunds/              # Refund logic on webhook updates
├── plans/                # Plan syncing from Stripe
├── common/               # Pipes, filters, shared logic
├── logger/               # Winston logger setup
├── config/               # env + DB config files
├── app.module.ts         # Root module
└── main.ts               # Bootstrap + global pipes/filters
checkoutUI/               # Frontend-UI for checkout-session
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/your-username/stripe-subscription-system.git
cd stripe-subscription-system
npm install
```

### 2. Setup `.env`

```env
PORT=3000
NODE_ENV=development

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_NAME=stripe_db
```

### 3. Run the App

```bash
npm run start:dev
```

> The webhook controller expects **rawBody**, so it’s already configured using `express.json({ verify })`.

---

## Test Flow

### Step 1: Create Checkout Session

> Use frontend or Postman to call `POST /stripe/checkout`

```http
POST /stripe/checkout
{
  "userId": "deek0811",
  "planId": "price_1Rj..."
}
```

> You’ll get a Stripe Checkout URL. Open it, subscribe using test card (`4242 4242 4242 4242`), complete the payment.

### Step 2: Stripe Fires Webhook

- Stripe hits your `/webhooks/stripe` endpoint.
- Subscription is saved automatically.
- Any future update/cancel also triggers webhooks and updates to DB.

---

## Stripe Webhook Events Handled

| Event                              | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `checkout.session.completed`       | Saves subscription on successful payment |
| `customer.subscription.updated`    | Updates status, dates, price in DB       |
| `customer.subscription.deleted`    | Cancels the subscription in DB           |
| `refund.updated`                   | Tracks refund status                     |
| `price.updated`, `product.updated` | Syncs latest plans to DB                 |

---

## Production-Ready Features

- Safe error handling (production messages in live mode)
- Winston logger (logs saved in `logs/` folder)
- Global validation and exception handling
- Config-driven `.env` system with validation
- TypeORM-powered DB with scalable entity structure
- Clean service/controller separation
- Edge cases handled:

- Subscription exists? → skip creation
- Invalid plan → 400 error with message
- Duplicate webhook event → ignored
- User cancels? → mark as `canceled`
- Stripe webhook fails? → logs error, sends generic message
- RawBody ensured for signature verification

---

## What I Learned

- Built a complete subscription billing system from scratch
- Understood how to integrate and validate Stripe webhooks
- Designed DB schemas for real-world plan tracking
- Made all logic idempotent and safe against replays
- Learned to log everything clearly for debugging and audit
- Created robust retry-safe webhook logic
- Realized how real SaaS platforms handle this at scale

---

## Improvements for Future

- Add email notifications after subscription actions
- Add admin dashboard to manage plans/subscriptions
- Add retry queue (Bull/Redis) for failed webhooks
- Add frontend integration
- Add Stripe Connect (for multi-vendor billing)

---

## Made By Deeksha

> Built with using Stripe, NestJS, PostgreSQL, and production-level thinking.
