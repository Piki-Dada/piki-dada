import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private fromAddress: string;
  private webUrl: string;

  constructor(private config: ConfigService) {
    this.transporter = createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 465),
      secure: this.config.get<number>('SMTP_PORT', 465) === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
    this.fromAddress = this.config.getOrThrow<string>('SMTP_FROM_EMAIL');
    this.webUrl = this.config.getOrThrow<string>('CORS_ORIGIN');
  }

  async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
    } catch (err) {
      // Email delivery failures shouldn't break the request flow (e.g. placeholder SMTP creds in dev)
      console.error('EmailService: failed to send', subject, 'to', to, err);
    }
  }

  sendWelcomeEmail(to: string, name: string) {
    return this.send(
      to,
      'Welcome to Piki Dada',
      `<p>Hi ${escapeHtml(name)},</p><p>Welcome to Piki Dada! Your account is ready.</p>`,
    );
  }

  sendTripReceipt(to: string, fare: number, currency: string, tripId: string) {
    return this.send(
      to,
      'Your Piki Dada trip receipt',
      `<p>Your trip is complete.</p><p><strong>${fare} ${currency}</strong></p><p>Trip ID: ${tripId}</p>`,
    );
  }

  sendVerificationEmail(to: string, token: string) {
    const link = `${this.webUrl}/verify-email?token=${token}`;
    return this.send(
      to,
      'Verify your Piki Dada email',
      `<p>Confirm this is your email address by clicking the link below.</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
    );
  }

  sendPasswordResetEmail(to: string, token: string) {
    const link = `${this.webUrl}/reset-password?token=${token}`;
    return this.send(
      to,
      'Reset your Piki Dada password',
      `<p>We received a request to reset your password.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
    );
  }
}
