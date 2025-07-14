import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsUppercase,
  Length,
} from 'class-validator';

export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  stripeProductId: string;

  @IsString()
  @IsNotEmpty()
  stripePriceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsUppercase()
  @Length(3, 3)
  currency: string;

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsOptional()
  @IsString()
  description?: string;
}
