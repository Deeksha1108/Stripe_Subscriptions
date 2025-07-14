import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Request, Response } from 'express';
import { logger } from 'src/logger/winston-logger';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    logger.info('Stripe webhook hit received');

    const result = await this.webhookService.processStripeWebhook(
      req,
      signature,
    );

    if (!result.success) {
      logger.warn('Stripe webhook processing failed', {
        message: result.message,
      });
      return res.status(400).send(result.message);
    }

    logger.info('Stripe webhook processed successfully');
    return res.send({ received: true });
  }
}
