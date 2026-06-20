import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromAddress: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.fromAddress = this.config.getOrThrow<string>('RESEND_FROM_EMAIL');
  }

  async send(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({ from: this.fromAddress, to, subject, html });
    } catch {
      // Email delivery failures shouldn't break the request flow (e.g. placeholder API key in dev)
    }
  }

  sendWelcomeEmail(to: string, name: string) {
    return this.send(
      to,
      'Welcome to Piki Dada',
      `<p>Hi ${name},</p><p>Welcome to Piki Dada! Your account is ready.</p>`,
    );
  }

  sendTripReceipt(to: string, fare: number, currency: string, tripId: string) {
    return this.send(
      to,
      'Your Piki Dada trip receipt',
      `<p>Your trip is complete.</p><p><strong>${fare} ${currency}</strong></p><p>Trip ID: ${tripId}</p>`,
    );
  }
}
