import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { logger } from 'src/logger/winston-logger';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async create(createDto: CreateSubscriptionDto): Promise<Subscription> {
    logger.info('Saving subscription to DB', { createDto });
    const existing = await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId: createDto.stripeSubscriptionId },
    });

    if (existing) {
      logger.warn('Subscription with this Stripe ID already exists', {
        stripeSubscriptionId: createDto.stripeSubscriptionId,
      });
      return existing;
    }
    const subscription = this.subscriptionRepo.create(createDto);
    const saved = await this.subscriptionRepo.save(subscription);
    logger.info('Subscription saved to DB', { id: saved.id });
    return saved;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    logger.info('Looking for subscription by userId', { userId });
    return await this.subscriptionRepo.findOne({
      where: { userId },
    });
  }

  async findByStripeSubscriptionId(
    stripeSubId: string,
  ): Promise<Subscription | null> {
    logger.info('Looking for subscription by Stripe Subscription ID', {
      stripeSubId,
    });
    return await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId: stripeSubId },
    });
  }

  async updateStatusByStripeId(
    stripeSubscriptionId: string,
    updateDto: Partial<UpdateSubscriptionDto>,
  ): Promise<Subscription> {
    const subscription =
      await this.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!subscription) {
      logger.warn('Subscription not found for update', {
        stripeSubscriptionId,
      });
      throw new NotFoundException('Not found!');
    }

    logger.info('Updating subscription', {
      id: subscription.id,
      updateDto,
    });

    if (updateDto.status) {
      subscription.status = updateDto.status;
    }

    if (updateDto.currentPeriodStart) {
      subscription.currentPeriodStart = new Date(updateDto.currentPeriodStart);
    }

    if (updateDto.currentPeriodEnd) {
      subscription.currentPeriodEnd = new Date(updateDto.currentPeriodEnd);
    }

    if (updateDto.cancelAt) {
      subscription.cancelAt = new Date(updateDto.cancelAt);
    }

    if (updateDto.canceledAt) {
      subscription.canceledAt = new Date(updateDto.canceledAt);
    }

    if (typeof updateDto.cancelAtPeriodEnd === 'boolean') {
      subscription.cancelAtPeriodEnd = updateDto.cancelAtPeriodEnd;
    }

    if (updateDto.priceId) {
      subscription.priceId = updateDto.priceId;
    }

    const updated = await this.subscriptionRepo.save(subscription);
    logger.info('Subscription updated', { id: updated.id });
    return updated;
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
  ): Promise<Subscription> {
    const subscription =
      await this.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!subscription) {
      logger.warn('Subscription not found for cancelation', {
        stripeSubscriptionId,
      });
      throw new NotFoundException('Not found!');
    }

    logger.info('Cancelling subscription', {
      id: subscription.id,
    });

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();

    const cancelled = await this.subscriptionRepo.save(subscription);
    logger.info('Subscription cancelled', { id: cancelled.id });
    return cancelled;
  }
}
