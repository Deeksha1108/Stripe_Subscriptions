import { registerAs } from '@nestjs/config';
import { logger } from 'src/logger/winston-logger';

const apiKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!apiKey || !webhookSecret) {
  logger.error('Missing Stripe config in environment variables', {
    STRIPE_SECRET_KEY: apiKey,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
  });
}

export default registerAs('stripe', () => ({
  apiKey,
  webhookSecret,
}));
