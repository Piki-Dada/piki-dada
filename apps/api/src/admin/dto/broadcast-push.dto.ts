import { IsOptional, IsString } from 'class-validator';

export class BroadcastPushDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  url?: string;
}
