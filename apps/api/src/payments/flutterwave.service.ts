import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FlutterwaveService {
  constructor(private config: ConfigService) {}

  async initializePayment(params: {
    tripId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    redirectUrl: string;
  }) {
    const res = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: `trip-${params.tripId}-${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        redirect_url: params.redirectUrl,
        customer: { email: params.customerEmail },
        meta: { tripId: params.tripId },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>('FLUTTERWAVE_SECRET_KEY')}`,
        },
      },
    );
    return res.data.data.link as string;
  }

  verifyWebhookSignature(signatureHeader: string | undefined) {
    const expected = this.config.getOrThrow<string>('FLUTTERWAVE_SECRET_HASH');
    return signatureHeader === expected;
  }

  async verifyTransaction(transactionId: string) {
    const res = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>('FLUTTERWAVE_SECRET_KEY')}`,
        },
      },
    );
    return res.data.data;
  }
}
