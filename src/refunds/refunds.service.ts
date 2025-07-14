import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Refund } from './entities/refund.entity';
import { Repository } from 'typeorm';
import { CreateRefundDto } from './dto/create-refund.dto';
import Stripe from 'stripe';
import { logger } from 'src/logger/winston-logger';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,

    @Inject('STRIPE_CLIENT')
    private readonly stripe: Stripe,
  ) {}

  async createRefund(dto: CreateRefundDto, userId: string) {
    logger.info('Attempting to create Stripe refund', { payload: dto });
    const existing = await this.refundRepo.findOne({
      where: { stripePaymentIntentId: dto.paymentIntentId },
    });
    if (existing) {
      logger.warn('Refund already exists for this paymentIntent', {
        paymentIntentId: dto.paymentIntentId,
      });
      throw new ConflictException('Already exists!');
    }

    let refund: Stripe.Response<Stripe.Refund> | null = null;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        refund = await this.stripe.refunds.create({
          payment_intent: dto.paymentIntentId,
          reason: dto.reason as Stripe.RefundCreateParams.Reason,
          amount: dto.amount,
        });

        logger.info('Stripe refund created successfully', {
          stripeRefundId: refund.id,
          paymentIntent: refund.payment_intent,
        });

        break;
      } catch (error) {
        logger.warn(`Stripe refund attempt ${attempt} failed`, {
          error: error?.message || error,
        });

        if (attempt >= maxAttempts) {
          logger.error('Failed to create refund after retries', { error });
          throw new InternalServerErrorException(
            'Something went wrong. Please try again later.',
          );
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    const saved = this.refundRepo.create({
      stripeRefundId: refund!.id,
      stripePaymentIntentId: refund!.payment_intent?.toString() || '',
      reason: dto.reason,
      amount: refund!.amount ?? 0,
      status: refund!.status ?? 'unknown',
      userId,
    });

    const result = await this.refundRepo.save(saved);

    logger.info('Refund saved to database', { refundId: result.id });

    return result;
  }

  async findAll(limit = 10, offset = 0) {
    logger.info('Fetching refunds with pagination', { limit, offset });
    try {
      const refunds = await this.refundRepo.find({
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' },
        withDeleted: false,
      });
      logger.info(`Found ${refunds.length} refunds`);
      return refunds;
    } catch (error) {
      logger.error('Error fetching refunds', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async findOne(id: string) {
    logger.info(`Fetching refund with ID: ${id}`);
    try {
      const refund = await this.refundRepo.findOne({
        where: { id },
        withDeleted: false,
      });

      if (refund) {
        logger.info('Refund found', { id });
      } else {
        logger.warn('Refund not found', { id });
        throw new NotFoundException('Resource not found!');
      }
      return refund;
    } catch (error) {
      logger.error('Error fetching refund by ID', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async updateRefundStatus(stripeRefundId: string, status: string) {
    logger.info('Updating refund status', {
      stripeRefundId,
      newStatus: status,
    });
    try {
      const refund = await this.refundRepo.findOne({
        where: { stripeRefundId },
      });

      if (!refund) {
        logger.warn('Refund not found for status update', { stripeRefundId });
        return;
      }

      refund.status = status;
      await this.refundRepo.save(refund);

      logger.info('Refund status updated', { refundId: refund.id });
    } catch (error) {
      logger.error('Error updating refund status', { error });
    }
  }

  async softDelete(id: string) {
    logger.info(`Soft deleting refund with ID: ${id}`);
    try {
      const result = await this.refundRepo.softDelete(id);
      if (result.affected === 0) {
        logger.warn('No refund found to delete', { id });
        throw new NotFoundException('Refund not found');
      }
      logger.info('Refund soft deleted', { id });
    } catch (error) {
      logger.error('Error soft deleting refund', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }
}
