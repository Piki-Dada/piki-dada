import { IsEnum, IsString } from 'class-validator';
import { RideType } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  color: string;

  @IsString()
  plateNumber: string;

  @IsEnum(RideType)
  rideType: RideType;
}
