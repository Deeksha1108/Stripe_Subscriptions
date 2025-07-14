import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { StripeService } from 'src/stripe/stripe.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from 'src/stripe/stripe.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { RefundsService } from 'src/refunds/refunds.service';
import { PlansService } from 'src/plans/plans.service';
import { Refund } from 'src/refunds/entities/refund.entity';
import { Plan } from 'src/plans/entities/plan.entity';

@Module({
  imports: [
    ConfigModule,
    StripeModule,
    TypeOrmModule.forFeature([Subscription, Refund, Plan]),
  ],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    StripeService,
    SubscriptionsService,
    RefundsService,
    PlansService,
  ],
})
export class WebhookModule {}
