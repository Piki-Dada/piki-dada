import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletController } from './wallet.controller';
import { StripeService } from './stripe.service';
import { FlutterwaveService } from './flutterwave.service';

@Module({
  controllers: [PaymentsController, WalletController],
  providers: [PaymentsService, StripeService, FlutterwaveService],
})
export class PaymentsModule {}
