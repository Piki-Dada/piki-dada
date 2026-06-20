import { Injectable } from '@nestjs/common';
import { PaymentStatus, TripStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPricingRuleDto } from './dto/upsert-pricing-rule.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalTrips, completedTrips, activeDrivers, totalPassengers, revenue] =
      await Promise.all([
        this.prisma.trip.count(),
        this.prisma.trip.count({ where: { status: TripStatus.COMPLETED } }),
        this.prisma.driver.count({ where: { isOnline: true } }),
        this.prisma.user.count({ where: { role: UserRole.PASSENGER } }),
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.PAID },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalTrips,
      completedTrips,
      activeDrivers,
      totalPassengers,
      totalRevenue: revenue._sum.amount ?? 0,
    };
  }

  listUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      omit: { passwordHash: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  setUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  listTrips() {
    return this.prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { passenger: { select: { name: true } }, driver: { include: { user: { select: { name: true } } } } },
    });
  }

  listPricingRules() {
    return this.prisma.pricingRule.findMany();
  }

  upsertPricingRule(rideType: 'ECONOMY' | 'COMFORT' | 'BODA', dto: UpsertPricingRuleDto) {
    return this.prisma.pricingRule.upsert({
      where: { rideType },
      update: dto,
      create: { rideType, ...dto },
    });
  }

  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createCoupon(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined },
    });
  }

  setCouponActive(id: string, isActive: boolean) {
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }
}
