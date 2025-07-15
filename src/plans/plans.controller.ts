import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import Stripe from 'stripe';
import { logger } from 'src/logger/winston-logger';

@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  @Get('sync')
  async syncPlans() {
    logger.info('Received request to sync plans from Stripe');
    try {
      const synced = await this.plansService.syncPlansFromStripe(this.stripe);
      logger.info(`Successfully synced plans from Stripe`);
      return {
        success: true,
        message: 'Plans synced from Stripe',
        count: synced.length,
        data: synced,
      };
    } catch (error) {
      logger.error('Failed to sync plans from Stripe', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  @Get()
  async getAllPlans() {
    logger.info('Request received to fetch all plans');
    try {
      const plans = await this.plansService.findAll();
      logger.info(`Fetched ${plans.length} plans`);
      return {
        success: true,
        message: 'Plans fetched successfully',
        data: plans,
      };
    } catch (error) {
      logger.error('Error fetching plans from DB', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    logger.info(`Fetching plan by ID: ${id}`);
    try {
      const plan = await this.plansService.findById(id);
      if (!plan) {
        logger.warn(`Plan not found with ID: ${id}`);
        throw new NotFoundException('Not found!');
      }
      logger.info('Plan fetched successfully', { id });
      return {
        success: true,
        message: 'Plan fetched successfully',
        data: plan,
      };
    } catch (error) {
      logger.error('Error fetching plan by ID', { error });
      throw error;
    }
  }
}
