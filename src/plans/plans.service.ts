import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { logger } from 'src/logger/winston-logger';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  async syncPlansFromStripe(stripe: Stripe): Promise<Plan[]> {
    logger.info('Syncing plans from Stripe...');

    const syncedPlans: Plan[] = [];
    try {
      const prices = await stripe.prices.list({
        expand: ['data.product'],
        active: true,
        limit: 100,
      });

      for (const price of prices.data) {
        if (
          price.type === 'recurring' &&
          price.unit_amount &&
          typeof price.product !== 'string' &&
          !price.product.deleted &&
          price.recurring
        ) {
          const product = price.product as Stripe.Product;

          const plan = this.planRepo.create({
            stripePriceId: price.id,
            stripeProductId: product.id,
            name: product.name,
            amount: price.unit_amount,
            currency: price.currency?.toUpperCase() || 'USD',
            interval: price.recurring.interval,
            description: product.description || null,
          });

          await this.planRepo
            .createQueryBuilder()
            .insert()
            .values(plan)
            .orUpdate(
              ['name', 'amount', 'interval', 'description', 'currency'],
              ['stripePriceId'],
            )
            .execute();

          syncedPlans.push(plan);
          logger.debug('Plan synced', {
            stripePriceId: price.id,
            productName: product.name,
          });
        } else {
          logger.warn('Skipped price - Not a valid recurring plan', {
            priceId: price.id,
            reason: 'Invalid type or deleted product',
          });
        }
      }
      logger.info(`Total plans synced: ${syncedPlans.length}`);
      return syncedPlans;
    } catch (error) {
      logger.error('Error syncing plans from Stripe', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  findAll(): Promise<Plan[]> {
    logger.verbose('Fetching all plans from DB');
    return this.planRepo.find();
  }

  findByStripePriceId(stripePriceId: string): Promise<Plan | null> {
    logger.verbose(`Finding plan by Stripe price ID: ${stripePriceId}`);
    return this.planRepo.findOne({ where: { stripePriceId } });
  }

  findById(id: string): Promise<Plan | null> {
    logger.verbose(`Finding plan by DB ID: ${id}`);
    return this.planRepo.findOne({ where: { id } });
  }
}
