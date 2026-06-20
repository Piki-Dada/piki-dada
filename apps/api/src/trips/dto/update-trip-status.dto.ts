import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TripStatus } from '@prisma/client';

export class UpdateTripStatusDto {
  @IsEnum(TripStatus)
  status: TripStatus;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
