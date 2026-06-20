import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
