import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { TripsGateway } from './trips.gateway';
import { SOCKET_EVENTS } from './socket-events';
import { RequestTripDto } from './dto/request-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { RateTripDto } from './dto/rate-trip.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';

const SEARCH_RADIUS_KM = 6;
const PLATFORM_COMMISSION_RATE = 0.15;

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private gateway: TripsGateway,
    private notifications: NotificationsService,
    private emailService: EmailService,
  ) {}

  async requestTrip(passengerId: string, dto: RequestTripDto) {
    const pickup = { lat: dto.pickupLat, lng: dto.pickupLng };
    const destination = { lat: dto.destinationLat, lng: dto.destinationLng };
    const estimate = await this.pricing.estimateFare(dto.rideType, pickup, destination);

    const trip = await this.prisma.trip.create({
      data: {
        passengerId,
        status: TripStatus.SEARCHING,
        rideType: dto.rideType,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        destinationAddress: dto.destinationAddress,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        distanceKm: estimate.distanceKm,
        durationMin: estimate.durationMin,
        fare: estimate.fare,
        currency: estimate.currency,
        couponCode: dto.couponCode,
        paymentMethod: dto.paymentMethod,
      },
    });

    const nearbyDrivers = await this.findNearbyDrivers(dto.rideType, pickup);
    for (const driver of nearbyDrivers) {
      this.gateway.emitToUser(driver.userId, SOCKET_EVENTS.TRIP_REQUESTED, {
        tripId: trip.id,
        pickupAddress: trip.pickupAddress,
        destinationAddress: trip.destinationAddress,
        fare: trip.fare,
        rideType: trip.rideType,
      });
    }

    return { trip, candidateDriverCount: nearbyDrivers.length };
  }

  private async findNearbyDrivers(rideType: string, pickup: { lat: number; lng: number }) {
    const onlineDrivers = await this.prisma.driver.findMany({
      where: {
        isOnline: true,
        approvalStatus: 'APPROVED',
        currentLat: { not: null },
        currentLng: { not: null },
        vehicle: { rideType: rideType as never },
      },
    });

    return onlineDrivers
      .map((driver) => ({
        ...driver,
        distanceKm: this.pricing.haversineDistanceKm(pickup, {
          lat: driver.currentLat!,
          lng: driver.currentLng!,
        }),
      }))
      .filter((driver) => driver.distanceKm <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async acceptTrip(driverUserId: string, tripId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== TripStatus.SEARCHING) {
      throw new BadRequestException('Trip is no longer available');
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.ACCEPTED, driverId: driver.id, acceptedAt: new Date() },
      include: { driver: { include: { vehicle: true, user: { omit: { passwordHash: true } } } } },
    });

    this.gateway.emitToUser(trip.passengerId, SOCKET_EVENTS.TRIP_ACCEPTED, updated);
    this.notifications.notifyUser(
      trip.passengerId,
      'Driver on the way',
      `${updated.driver?.user?.name ?? 'Your driver'} accepted your ride request.`,
    );
    return updated;
  }

  async rejectTrip(driverUserId: string, tripId: string) {
    this.gateway.emitToUser(driverUserId, SOCKET_EVENTS.TRIP_REJECTED, { tripId });
    return { success: true };
  }

  async updateStatus(userId: string, tripId: string, dto: UpdateTripStatusDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, passenger: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    const isPassenger = trip.passengerId === userId;
    const isDriver = trip.driver?.userId === userId;
    if (!isPassenger && !isDriver) {
      throw new ForbiddenException('Not part of this trip');
    }

    const timestampField = this.timestampFieldFor(dto.status);
    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: dto.status,
        cancellationReason: dto.cancellationReason,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
      },
    });

    if (dto.status === TripStatus.COMPLETED) {
      await this.prisma.payment.create({
        data: {
          tripId,
          amount: trip.fare ?? 0,
          currency: trip.currency,
          method: trip.paymentMethod,
          status: trip.paymentMethod === PaymentMethod.CASH ? PaymentStatus.PAID : PaymentStatus.PENDING,
        },
      });
      if (trip.driverId && trip.driver) {
        await this.prisma.driver.update({
          where: { id: trip.driverId },
          data: { totalTrips: { increment: 1 } },
        });
        const driverEarnings = Math.round((trip.fare ?? 0) * (1 - PLATFORM_COMMISSION_RATE));
        await this.prisma.wallet.update({
          where: { userId: trip.driver.userId },
          data: {
            balance: { increment: driverEarnings },
            ledgerEntries: {
              create: { amount: driverEarnings, reason: `Trip ${tripId} earnings` },
            },
          },
        });
      }
      this.notifications.notifyUser(
        trip.passengerId,
        'Trip completed',
        `Your trip is complete. Fare: ${trip.fare} ${trip.currency}.`,
      );
      this.emailService.sendTripReceipt(
        trip.passenger.email,
        trip.fare ?? 0,
        trip.currency,
        tripId,
      );
    }

    const event =
      dto.status === TripStatus.CANCELLED
        ? SOCKET_EVENTS.TRIP_CANCELLED
        : SOCKET_EVENTS.TRIP_STATUS_UPDATED;
    this.gateway.emitToTrip(tripId, event, updated);
    this.gateway.emitToUser(trip.passengerId, event, updated);

    return updated;
  }

  private timestampFieldFor(status: TripStatus): string | null {
    switch (status) {
      case TripStatus.ARRIVED:
        return 'arrivedAt';
      case TripStatus.IN_PROGRESS:
        return 'startedAt';
      case TripStatus.COMPLETED:
        return 'completedAt';
      case TripStatus.CANCELLED:
        return 'cancelledAt';
      default:
        return null;
    }
  }

  async rateTrip(raterId: string, tripId: string, dto: RateTripDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: { include: { user: true } } },
    });
    if (!trip || trip.status !== TripStatus.COMPLETED) {
      throw new BadRequestException('Trip must be completed before rating');
    }

    const isPassenger = trip.passengerId === raterId;
    const toUserId = isPassenger ? trip.driver?.user?.id : trip.passengerId;
    if (!toUserId) {
      throw new BadRequestException('Unable to determine rating recipient');
    }

    const rating = await this.prisma.rating.create({
      data: { tripId, fromUserId: raterId, toUserId, stars: dto.stars, comment: dto.comment },
    });

    if (isPassenger && trip.driverId) {
      const avg = await this.prisma.rating.aggregate({
        where: { toUserId },
        _avg: { stars: true },
      });
      await this.prisma.driver.update({
        where: { id: trip.driverId },
        data: { rating: avg._avg.stars ?? 5 },
      });
    }

    return rating;
  }

  myTrips(userId: string, role: 'PASSENGER' | 'DRIVER') {
    if (role === 'DRIVER') {
      return this.prisma.trip.findMany({
        where: { driver: { userId } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.trip.findMany({
      where: { passengerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getTrip(tripId: string) {
    return this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: { include: { vehicle: true } }, payment: true },
    });
  }
}
