import { IsString } from 'class-validator';

class PushSubscriptionKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  keys: PushSubscriptionKeysDto;
}

export class UnsubscribeDto {
  @IsString()
  endpoint: string;
}
