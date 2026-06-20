import { IsNumber, IsString } from 'class-validator';

export class UpsertPricingRuleDto {
  @IsNumber()
  baseFare: number;

  @IsNumber()
  perKm: number;

  @IsNumber()
  perMinute: number;

  @IsString()
  currency: string;
}
