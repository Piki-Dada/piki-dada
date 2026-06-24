import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { FlutterwaveService } from './flutterwave.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
    private flutterwaveService: FlutterwaveService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PASSENGER)
  @Post(':tripId/stripe/checkout')
  createStripeCheckout(@CurrentUser() user: { id: string }, @Param('tripId') tripId: string) {
    return this.paymentsService.createStripeCheckout(tripId, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PASSENGER)
  @Post(':tripId/flutterwave/checkout')
  createFlutterwaveCheckout(
    @CurrentUser() user: { id: string },
    @Param('tripId') tripId: string,
  ) {
    return this.paymentsService.createFlutterwaveCheckout(tripId, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PASSENGER)
  @Post(':tripId/cash/confirm')
  confirmCashPayment(@CurrentUser() user: { id: string }, @Param('tripId') tripId: string) {
    return this.paymentsService.confirmCashPayment(tripId, user.id);
  }

  @SkipThrottle()
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.constructWebhookEvent(req.rawBody!, signature);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { tripId?: string }; id: string };
      if (session.metadata?.tripId) {
        await this.paymentsService.markTripPaid(session.metadata.tripId, session.id);
      }
    }
    return { received: true };
  }

  @SkipThrottle()
  @Post('webhooks/flutterwave')
  async flutterwaveWebhook(
    @Body() body: { data?: { id: string; meta?: { tripId?: string }; status?: string } },
    @Headers('verif-hash') signature: string,
  ) {
    if (!this.flutterwaveService.verifyWebhookSignature(signature)) {
      throw new BadRequestException('Invalid signature');
    }
    const tripId = body.data?.meta?.tripId;
    if (tripId && body.data?.status === 'successful') {
      await this.paymentsService.markTripPaid(tripId, String(body.data.id));
    }
    return { received: true };
  }
}
