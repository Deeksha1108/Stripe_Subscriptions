import { Module } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from './entities/refund.entity';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [TypeOrmModule.forFeature([Refund]), StripeModule],
  controllers: [RefundsController],
  providers: [RefundsService],
})
export class RefundsModule {}
