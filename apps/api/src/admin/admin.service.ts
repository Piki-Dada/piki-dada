import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus, TripStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPricingRuleDto } from './dto/upsert-pricing-rule.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { decryptUserPhone } from '../common/field-encryption';

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

  async listUsers(role?: UserRole) {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      omit: { passwordHash: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(decryptUserPhone);
  }

  setUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      omit: { passwordHash: true },
    });
  }

  async promoteToAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.role === UserRole.ADMIN) throw new BadRequestException('User is already an admin');
    if (!user.emailVerifiedAt) {
      throw new BadRequestException('User must have a verified email before being promoted to admin');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ADMIN },
      omit: { passwordHash: true },
    });
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
