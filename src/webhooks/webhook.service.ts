import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { StripeService } from 'src/stripe/stripe.service';
import { logger } from 'src/logger/winston-logger';
import { PlansService } from 'src/plans/plans.service';
import { RefundsService } from 'src/refunds/refunds.service';

type StripeSubscriptionExtended = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
  cancel_at?: number;
  canceled_at?: number;
  cancel_at_period_end?: boolean;
};

@Injectable()
export class WebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly refundService: RefundsService,
    private readonly stripeService: StripeService,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  async processStripeWebhook(
    req: Request,
    signature: string,
  ): Promise<{ success: boolean; message: string }> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      logger.error('Missing Stripe webhook secret');
      return { success: false, message: 'Missing webhook secret' };
    }

    let event: Stripe.Event;
    try {
      const rawBody = (req as any).rawBody || (await this.getRawBody(req));
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      logger.error('Stripe signature verification failed', {
        error: err.message,
      });
      return { success: false, message: `Signature error: ${err.message}` };
    }

    const eventType = event.type;
    logger.info('Webhook Event Received', { type: eventType });

    try {
      switch (eventType) {
        case 'checkout.session.completed':
          try {
            await this.handleCheckoutSessionCompleted(
              event.data.object as Stripe.Checkout.Session,
            );
          } catch (err: any) {
            logger.error('Error in checkout.session.completed', {
              error: err.message,
            });
            return {
              success: false,
              message: 'Error handling checkout.session.completed',
            };
          }
          break;

        case 'customer.subscription.updated':
          try {
            await this.handleSubscriptionUpdated(
              event.data.object as StripeSubscriptionExtended,
            );
          } catch (err: any) {
            logger.error('Error in customer.subscription.updated', {
              error: err.message,
            });
            return {
              success: false,
              message: 'Error handling subscription.updated',
            };
          }
          break;

        case 'customer.subscription.deleted':
          try {
            await this.handleSubscriptionDeleted(
              event.data.object as Stripe.Subscription,
            );
          } catch (err: any) {
            logger.error('Error in customer.subscription.deleted', {
              error: err.message,
            });
            return {
              success: false,
              message: 'Error handling subscription.deleted',
            };
          }
          break;

        case 'refund.updated':
          await this.handleRefundUpdated(event.data.object as Stripe.Refund);
          break;

        case 'product.created':
        case 'product.updated':
        case 'price.created':
        case 'price.updated':
          await this.handlePlanSync();
          break;

        default:
          logger.warn('Unhandled event type', { type: eventType });
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      logger.error('Webhook processing failed', { error, eventType });
      return { success: false, message: 'Internal error in webhook handler' };
    }
  }

  private async getRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!session.client_reference_id) {
      throw new Error('Missing client_reference_id');
    }

    const subscription = (await this.stripe.subscriptions.retrieve(
      subscriptionId,
    )) as StripeSubscriptionExtended;

    const item = subscription.items.data[0];

    await this.subscriptionsService.create({
      userId: session.client_reference_id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      priceId: item.price.id,
      status: subscription.status,
      currentPeriodStart: this.toISOString(subscription.current_period_start),
      currentPeriodEnd: this.toISOString(subscription.current_period_end),
      cancelAt: this.toISOString(subscription.cancel_at),
      canceledAt: this.toISOString(subscription.canceled_at),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    logger.info('Subscription saved on checkout.session.completed', {
      subscriptionId,
    });
  }

  private async handleSubscriptionUpdated(sub: StripeSubscriptionExtended) {
    const item = sub.items.data[0];

    await this.subscriptionsService.updateStatusByStripeId(sub.id, {
      status: sub.status,
      priceId: item.price.id,
      currentPeriodStart: this.toISOString(sub.current_period_start),
      currentPeriodEnd: this.toISOString(sub.current_period_end),
      cancelAt: this.toISOString(sub.cancel_at),
      canceledAt: this.toISOString(sub.canceled_at),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });

    logger.info('Subscription updated from Stripe', { subscriptionId: sub.id });
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    await this.subscriptionsService.cancelSubscription(sub.id);
    logger.info('Subscription cancelled from Stripe', {
      subscriptionId: sub.id,
    });
  }

  private async handleRefundUpdated(refund: Stripe.Refund) {
    const stripeRefundId = refund.id;
    const status = refund.status;
    if (!status) {
      logger.warn('Refund webhook received with null status', {
        stripeRefundId,
      });
      return;
    }
    await this.refundService.updateRefundStatus(stripeRefundId, status);

    logger.info('Refund status updated from Stripe webhook', {
      stripeRefundId,
      status,
    });
  }

  private async handlePlanSync() {
    try {
      await this.plansService.syncPlansFromStripe(this.stripe);
      logger.info('Plan synced from Stripe (via webhook)');
    } catch (error: any) {
      logger.error('Error syncing plans from webhook', {
        error: error.message,
      });
      throw error;
    }
  }

  private toISOString(unix: number | null | undefined): string | undefined {
    return unix ? new Date(unix * 1000).toISOString() : undefined;
  }
}
