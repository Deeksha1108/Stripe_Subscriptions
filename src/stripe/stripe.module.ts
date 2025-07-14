import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, SubscriptionsModule],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const stripe = require('stripe');
        return new stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
          apiVersion: '2023-10-16',
        });
      },
    },
    StripeService,
  ],
  controllers: [StripeController],
  exports: ['STRIPE_CLIENT', StripeService],
})
export class StripeModule {}
