import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { logger } from 'src/logger/winston-logger';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateRefundDto, @Query('userId') userId: string) {
    logger.info('Received request to create a refund', {
      payload: dto,
      userId,
    });
    try {
      const refund = await this.refundsService.createRefund(dto, userId);
      logger.info('Refund created successfully', { refundId: refund.id });

      return {
        success: true,
        message: 'Refund created successfully',
        data: refund,
      };
    } catch (error) {
      logger.error('Error creating refund', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  @Get()
  async findAll() {
    logger.info('Fetching all refunds');
    try {
      const refunds = await this.refundsService.findAll();
      logger.info(`Found ${refunds.length} refunds`);
      return {
        success: true,
        count: refunds.length,
        data: refunds,
      };
    } catch (error) {
      logger.error('Error fetching refunds', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    logger.info(`Fetching refund with ID: ${id}`);
    try {
      const refund = await this.refundsService.findOne(id);
      if (refund) {
        logger.info('Refund found', { refundId: id });
      } else {
        logger.warn('Refund not found', { refundId: id });
      }
      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      logger.error('Error fetching refund', { error });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }
}
