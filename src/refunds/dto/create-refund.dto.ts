import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsOptional()
  @IsIn(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
