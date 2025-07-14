import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validationSchema } from './config/env.validation';
import { typeOrmConfig } from './config/typeorm.config';
import stripeConfig from './config/stripe.config';

import { StripeModule } from './stripe/stripe.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WebhookModule } from './webhooks/webhooks.module';
import { RefundsModule } from './refunds/refunds.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [stripeConfig],
      validationSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    StripeModule,
    SubscriptionsModule,
    WebhookModule,
    RefundsModule,
  ],
})
export class AppModule {}
