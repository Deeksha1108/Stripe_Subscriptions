import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { logger } from 'src/logger/winston-logger';

@Injectable()
export class StripeService {
  constructor(
    @Inject('STRIPE_CLIENT')
    private readonly stripe: Stripe,
  ) {}

  async createCustomer(email: string): Promise<Stripe.Customer> {
    try {
      logger.info('Creating Stripe customer', { email });

      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const existing = existingCustomers.data[0];
        logger.info('Existing Stripe customer found', {
          customerId: existing.id,
          email: existing.email,
        });
        return existing;
      }

      logger.info('No existing customer found. Creating new Stripe customer.');

      const customer = await this.stripe.customers.create({ email });

      logger.info('Stripe customer created successfully', {
        customerId: customer.id,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        email,
        error: error.message || error,
      });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async createCheckoutSession(data: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      logger.info('Creating Stripe checkout session', data);

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: data.customerId,
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,

        payment_intent_data: {
          metadata: {
            userId: data.userId,
          },
        },
      });

      logger.info('Checkout session created successfully', {
        sessionId: session.id,
        url: session.url,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', {
        data,
        error: error.message || error,
      });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Retrieving subscription', { subscriptionId });

      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      logger.info('Subscription retrieved', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve subscription', {
        subscriptionId,
        error: error.message || error,
      });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Cancelling subscription', { subscriptionId });

      const cancelled = await this.stripe.subscriptions.cancel(subscriptionId);

      logger.info('Subscription cancelled successfully', {
        subscriptionId: cancelled.id,
        status: cancelled.status,
      });

      return cancelled;
    } catch (error) {
      logger.error('Failed to cancel subscription', {
        subscriptionId,
        error: error.message || error,
      });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }
}
