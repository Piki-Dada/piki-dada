import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, RideType } from '@prisma/client';

export class RequestTripDto {
  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  @IsString()
  pickupAddress: string;

  @IsNumber()
  destinationLat: number;

  @IsNumber()
  destinationLng: number;

  @IsString()
  destinationAddress: string;

  @IsEnum(RideType)
  rideType: RideType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
