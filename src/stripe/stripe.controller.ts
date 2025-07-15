import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  Res,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Response, Request } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { logger } from 'src/logger/winston-logger';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  @Post('checkout-session')
  async createCheckoutSession(@Body() body: any) {
    const { email, priceId, successUrl, cancelUrl } = body;

    logger.info('Creating Stripe checkout session', { email, priceId });

    try {
      const customer = await this.stripeService.createCustomer(email);
      logger.info('Stripe customer created', { customerId: customer.id });

      const session = await this.stripeService.createCheckoutSession({
        customerId: customer.id,
        priceId,
        successUrl,
        cancelUrl,
        userId: body.userId,
      });

      logger.info('Stripe checkout session created', {
        sessionId: session.id,
        url: session.url,
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      logger.error('Error creating Stripe checkout session', { error });
      throw error;
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is missing in env');
      return res.status(500).send('Server misconfigured');
    }

    let event: Stripe.Event;

    try {
      const rawBody =
        (req as any).rawBody ||
        (await new Promise<Buffer>((resolve, reject) => {
          const chunks: Uint8Array[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        }));

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      logger.info('Stripe webhook received', { eventType: event.type });

      if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        const subscription = event.data.object as any;

        const updatedData = {
          status: subscription.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ).toISOString(),
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          cancelAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : undefined,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: subscription.items.data[0]?.price.id ?? undefined,
        };

        logger.info('Updating DB subscription with Stripe webhook data', {
          stripeSubscriptionId: subscription.id,
          updatedData,
        });

        await this.subscriptionsService.updateStatusByStripeId(
          subscription.id,
          updatedData,
        );

        logger.info('DB subscription updated via webhook', {
          stripeSubscriptionId: subscription.id,
        });
      }

      res.send({ success: true });
    } catch (err: any) {
      logger.error('Webhook signature verification failed', {
        error: err.message,
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
