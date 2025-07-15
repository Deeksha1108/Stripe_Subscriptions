import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsIn([
    'active',
    'incomplete',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete_expired',
  ])
  status?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsDateString()
  cancelAt?: string;

  @IsOptional()
  @IsDateString()
  canceledAt?: string;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsString()
  priceId?: string;
}
