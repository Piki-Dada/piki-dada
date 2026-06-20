import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { FlutterwaveService } from './flutterwave.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private flutterwaveService: FlutterwaveService,
    private config: ConfigService,
  ) {}

  private async getPayableTrip(tripId: string, passengerId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { payment: true, passenger: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.passengerId !== passengerId) throw new BadRequestException('Not your trip');
    if (!trip.payment || trip.payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Trip has no pending payment');
    }
    return trip;
  }

  async createStripeCheckout(tripId: string, passengerId: string) {
    const trip = await this.getPayableTrip(tripId, passengerId);
    const webUrl = this.config.getOrThrow<string>('CORS_ORIGIN');
    const url = await this.stripeService.createCheckoutSession({
      tripId,
      amount: trip.payment!.amount,
      currency: trip.payment!.currency,
      successUrl: `${webUrl}/passenger/trip/${tripId}?paid=1`,
      cancelUrl: `${webUrl}/passenger/trip/${tripId}`,
    });
    return { url };
  }

  async createFlutterwaveCheckout(tripId: string, passengerId: string) {
    const trip = await this.getPayableTrip(tripId, passengerId);
    const webUrl = this.config.getOrThrow<string>('CORS_ORIGIN');
    const url = await this.flutterwaveService.initializePayment({
      tripId,
      amount: trip.payment!.amount,
      currency: trip.payment!.currency,
      customerEmail: trip.passenger.email,
      redirectUrl: `${webUrl}/passenger/trip/${tripId}?paid=1`,
    });
    return { url };
  }

  async markTripPaid(tripId: string, providerRef: string) {
    await this.prisma.payment.update({
      where: { tripId },
      data: { status: PaymentStatus.PAID, providerRef },
    });
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async withdraw(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amount },
        ledgerEntries: { create: { amount: -amount, reason: 'Withdrawal' } },
      },
    });
  }
}
