import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  NotFoundException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { logger } from 'src/logger/winston-logger';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() dto: CreateSubscriptionDto) {
    logger.info('Creating subscription', { dto });
    const subscription = await this.subscriptionsService.create(dto);
    logger.info('Subscription created', { id: subscription.id });
    return subscription;
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    logger.info(`Fetching subscription for userId: ${userId}`);
    const sub = await this.subscriptionsService.findByUserId(userId);
    if (!sub) {
      logger.warn(`No subscription found for userId: ${userId}`);
      throw new NotFoundException('Not found!');
    }
    logger.info('Subscription found', { subscriptionId: sub.id });
    return sub;
  }

  @Patch('update/:stripeSubId')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateByStripeId(
    @Param('stripeSubId') stripeSubId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    logger.info('Updating subscription by Stripe ID', {
      stripeSubId,
      updateDto,
    });
    return this.subscriptionsService.updateStatusByStripeId(
      stripeSubId,
      updateDto,
    );
  }

  @Patch('cancel/:stripeSubId')
  async cancel(@Param('stripeSubId') stripeSubId: string) {
    logger.info(`Cancelling subscription: ${stripeSubId}`);
    return this.subscriptionsService.cancelSubscription(stripeSubId);
  }
}
